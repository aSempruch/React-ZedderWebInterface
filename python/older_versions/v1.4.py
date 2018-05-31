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
		return start <= x <= end
	else:
		return start <= x or x <= end

if skip_delay == 0:
	if time_in_range(datetime.time(2,0,0), datetime.time(7,0,0), datetime.datetime.now().time()):
		if random.randint(1,25) != 1:
			print "Special Time Range Exit at : " + str(datetime.datetime.now().time())[:8]
			sys.exit(0)

	delay = random.randint(0,250)
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

cookies = {
	"EssUserTrk" : '4d6fa794.5665d98e8d86f',
	"_ga" : 'GA1.2.2136415061.1519927445',
	"_gid" : 'GA1.2.379448372.1519927445',
	"sessionid" : 'pzn96g9fmzya2imngxkmxkhzjq3z2yak'
}

s = requests.session()
lock = Lock()

date = datetime.datetime.now()
zed_date = str(date)[:10]
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

def collides(shiftDate, shiftTime):
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

def sendMail(message_text):

	fromaddr = "zeddershredder.py@gmail.com"
	toaddr = "alan3ir0@gmail.com"
	msg = MIMEMultipart()
	msg['From'] = fromaddr
	msg['To'] = toaddr
	msg['Subject'] = "Open Shift"
	 
	body = message_text
	msg.attach(MIMEText(body, 'plain'))
	 
	server = smtplib.SMTP('smtp.gmail.com', 587)
	server.starttls()
	server.login(fromaddr, "theultimateshredder")
	text = msg.as_string()
	server.sendmail(fromaddr, toaddr, text)
	server.quit()

	print "sent mail: " + message_text


def scanShifts(siteIndex):

	#print 'Scanning: ' + work_sites_name[siteIndex]

	r = s.get('https://zed.rutgers.edu/scheduling/open_shifts/'
		+ str(work_sites[siteIndex])
		+ '/?start_date='
		+ zed_date,
		cookies=cookies)

	soup = BeautifulSoup(r.text, 'lxml')
	s_table = soup.find('div', class_='schedule').find('table').find('tbody').find('tr').find_all('td')
	date_counter = -1;

	for cell in s_table:
		#This doesn't detect two shifts in one column
		shifts = cell.find('div', class_='scheduleShift')
		if cell.has_attr("class"):
			date_counter += 1
		if shifts is not None and shifts.find('input') is not None:

			print 'Found shift at ' + work_sites_name[siteIndex]
			#print shifts

			shift_date = date + datetime.timedelta(days=date_counter)
			time = str(shifts.find('p').contents)[3:-2]
			shift_id = shifts.find('input').attrs['value']
			if collides(shift_date, time):
				print "Shift collides with class"
			elif shift_id not in scanned:
				lock.acquire()
				f = open("/home/pi/python/beautifulsoup/shifts.txt", 'ab+')
				f.write(shift_id + '\n')
				f.close()
				lock.release()
				sendMail(work_sites_name[siteIndex]+" on "+calendar.day_name[shift_date.weekday()]+ " " + time + '\n\n'+r.url)
			else:
				print "Shift already scanned"
			print '\n'
	
threads = []

scanned = set(line.strip() for line in open('/home/pi/python/beautifulsoup/shifts.txt'))
#print scanned

for index in range(len(work_sites)):
	new_thread = Thread(target=scanShifts, args=(index,))
	threads.append(new_thread)
	new_thread.start()
	if skip_delay == 0:
		time.sleep(random.randint(1,10))

for t in threads:
    t.join()

#server.quit()
