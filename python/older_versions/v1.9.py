import random
import time
import sys
import datetime
import sys

skip_delay = 0
if 1 < len(sys.argv):
	if sys.argv[1] == '-nd':
		skip_delay = 1


if skip_delay == 0:
	if random.randint(1,10) == 1:
		print "Random Chance Exit at : " + str(datetime.datetime.now().time())[:8]
		sys.exit(0)

def time_in_range(start, end, x):
        if start <= end:
		return start < x < end
	else:
		return start < x or x < end

if skip_delay == 0:
	if time_in_range(datetime.time(3,0,0), datetime.time(7,0,0), datetime.datetime.now().time()):
		if random.randint(1,25) != 1:
			print "Special Time Range Exit at : " + str(datetime.datetime.now().time())[:8]
			sys.exit(0)

	# >>>> Delay Range Set Here <<<<
	delay = random.randint(1,40)

	print "Sleeping for "+str(delay)+" seconds"
	time.sleep(delay)
	print "New Run at : " + str(datetime.datetime.now().time())[:8]


import requests
import thread
from threading import Thread
from threading import Lock
import smtplib
import calendar
from bs4 import BeautifulSoup
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText
from pushover import Client
import json

pushover = Client("upj4bnkeiw5o33oo4wasaypd1kayu4", api_token="ayx9ht9kydgnu385mme9imn9fkae5y")


cookies = {
	"EssUserTrk" : '2bc40b31.5696c690ff5d7',
	#"_ga" : 'GA1.2.2136415061.1519927445',
	#"_gid" : 'GA1.2.379448372.1519927445',
	"sessionid" : '0yjnom9cl51wg5ikjqdrigulnxipvg9u'
}

s = requests.session()
lock = Lock()

work_sites = [
	28, #0 - AlexG
	29, #1 - AlexU
	25, #2 - CACC
	27, #3 - CACC-DISP
	30, #4 - RSC
	95  #5 - RUAB
]

work_sites_name = [
	'Alex Graduate',
	'Alex Undergrad',
	'CACC',
	'CACC-Dispatch',
	'RSC',
	'RUAB'
]

classes = [
	#Monday
	[datetime.time(3,0,0), datetime.time(11,0,0),
	datetime.time(12,0,0), datetime.time(13,20,0),
	datetime.time(14,50,0), datetime.time(16,10,0),
	datetime.time(17,0,0), datetime.time(18,20,0)],
	#Tuesday
	[datetime.time(3,0,0), datetime.time(11,0,0),
	datetime.time(12,0,0), datetime.time(13,20,0),
	datetime.time(18,40,0), datetime.time(20,0,0)],
	#Wednesday
	[datetime.time(3,0,0), datetime.time(11,0,0),
	datetime.time(12,0,0), datetime.time(13,20,0),
	datetime.time(17,0,0), datetime.time(18,20,0)],
	#Thursday
	[datetime.time(3,0,0), datetime.time(11,0,0),
	datetime.time(18,40,0), datetime.time(20,0,0)],
	#Friday
	[datetime.time(3,0,0), datetime.time(11,0,0),
	datetime.time(12,0,0), datetime.time(13,20,0)],
	#Saturday
	[datetime.time(3,0,0), datetime.time(11,0,0)],
	#Sunday
	[datetime.time(3,0,0), datetime.time(11,0,0)]
]

def parseErr(errCode):
	if errCode == 1:
		return 'Unable to parse page'
	if errCode == 2:
		return 'Redirected to unexpected page'

def collides(shiftDate, shiftTime):

	return False

	weekDay = shiftDate.weekday()
	start = datetime.datetime.strptime(shiftTime[0:7].strip(),'%I:%M%p').time()
	end = datetime.datetime.strptime(shiftTime[-7:].strip(),'%I:%M%p').time()
	print calendar.day_name[weekDay] + " | " + shiftTime
	#print str(start) + " | " + str(end)

	for index in range(0,len(classes[weekDay]),2):
		if time_in_range(start, end, classes[weekDay][index]):
			return True
		if time_in_range(start, end, classes[weekDay][index+1]):
			return True
		if time_in_range(classes[weekDay][index], classes[weekDay][index+1], start):
			return True
		if time_in_range(classes[weekDay][index], classes[weekDay][index+1], end):
			return True
	return False

def sendMail(title, body, url):

	pushover.send_message(body, title=title, url=url, url_title="Cover")

	print "sent notification: " + title + ": " + body

def save_obj(dict, name):
	json_string = json.dumps(dict)
	f = open("/home/pi/python/beautifulsoup/obj/"+name+".json","w")
	f.write(json_string)
	f.close()

def load_obj(name ):
    with open("/home/pi/python/beautifulsoup/obj/"+name+".json",'r') as f:
		return json.load(f)

def scanShifts(siteIndex,zed_date):

	#print 'Scanning: ' + work_sites_name[siteIndex]

	r = s.get('https://zed.rutgers.edu/scheduling/open_shifts/'
		+ str(work_sites[siteIndex])
		+ '/?start_date='
		+ zed_date,
		cookies=cookies)
	#print r.url[8:11]
	if r.url[8:11] != 'zed':
		return 2

	soup = BeautifulSoup(r.text, 'lxml')
	s_table = soup.find('div', class_='schedule').find('table').find('tbody').find('tr').find_all('td')
	date_counter = -1;

	for cell in s_table:
		shiftsCol = cell.find_all('div', class_='scheduleShift')
		if cell.has_attr("class"):
				date_counter += 1

		for shifts in shiftsCol:
			if shifts is not None and shifts.find('input') is not None:
				print 'Found shift at ' + work_sites_name[siteIndex]
				#print 'Shift posted by ' + str(shifts.find('div').contents[0]).strip().split()[2]
				try:
					time = str(shifts.find('p').contents)[3:-2]
				except:
					print "Shift had weird formating"
					time = "Undefined"

				shift_date = date + datetime.timedelta(days=date_counter)
				shift_id = shifts.find('input').attrs['value']
				if collides(shift_date, time):
					print "Shift collides with class"
				elif str(shift_id) not in dict_scanned:
					msgDate = ''
					if date_counter == 0 and s_week[0] == 1:
						msgDate += 'Today | '
					elif date_counter == 1 and s_week[0] == 1:
						msgDate += 'Tomorrow | '
					msgDate += calendar.day_name[shift_date.weekday()]
					sendMail(work_sites_name[siteIndex]+ s_week[1], msgDate + " " + time + " " + str(shift_date.date())[5:], r.url)
				else:
					print "Shift already scanned"
				lock.acquire()
				new_scanned[shift_id] = str(shifts.find('div').contents[0]).strip().split()[2]
				lock.release()
	return 0

class threadWithReturn(Thread):
    	def __init__(self, *args, **kwargs):
    		super(threadWithReturn, self).__init__(*args, **kwargs)
		self._return = None
	def run(self):
		if self._Thread__target is not None:
			self._return = self._Thread__target(*self._Thread__args, **self._Thread__kwargs)
	def join(self, *args, **kwargs):
		super(threadWithReturn, self).join(*args, **kwargs)
		return self._return

threads = []
s_week = []
if random.randint(0,3) is not 0:
	date = datetime.datetime.now()
	s_week = [1, ' this week']
else:
	date = datetime.datetime.now() + datetime.timedelta(7)
	s_week = [2, ' next week']

#scanned = set(line.strip() for line in open('/home/pi/python/beautifulsoup/shifts'+str(s_week[0])+'.txt'))
new_scanned = {}
covered = {}

dict_scanned = load_obj("dict_scanned"+str(s_week[0]))

#print scanned

print "Scanning week of " + str(date)[:10]

for index in range(len(work_sites)):
	new_thread = threadWithReturn(target=scanShifts, args=(index,str(date)[:10],))
	threads.append(new_thread)
	new_thread.start()
	if skip_delay == 0:
		time.sleep(random.randint(1,7))

errCode = 0
for t in threads:
    errCode = max(t.join(), errCode)


if errCode is not 0:
	try:
		open('/home/pi/python/beautifulsoup/err_occured')
	except:
		sendMail("Error", parseErr(errCode), "")
		open('/home/pi/python/beautifulsoup/err_occured', 'w')

save_obj(new_scanned, "dict_scanned"+str(s_week[0]))

#f = open("/home/pi/python/beautifulsoup/shifts"+str(s_week[0])+".txt", 'w')
#for item in new_scanned:
#	f.write(item + "\n")
#f.close()

#Check if something was covered
for shiftId, netid in dict_scanned.iteritems():
	if str(shiftId) not in new_scanned:
		sendMail("Shift ", shiftId + " posted by " + netid +" was covered",'');
