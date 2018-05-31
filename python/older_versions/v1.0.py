import requests
import datetime
import time
import smtplib
import calendar
from bs4 import BeautifulSoup

cookies = {
	"EssUserTrk" : '4d6fa794.5665d98e8d86f',
	"_ga" : 'GA1.2.2136415061.1519927445',
	"_gid" : 'GA1.2.379448372.1519927445',
	"sessionid" : 'pzn96g9fmzya2imngxkmxkhzjq3z2yak'
}

s = requests.session()

server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login("zeddershredder.py@gmail.com", "theultimateshredder")

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

f = open("/home/pi/python/beautifulsoup/shifts.txt", 'ab+')

def sendMail(msg):
	server.sendmail("zeddershredder.py@gmail.com", "alan3ir0@gmail.com", msg)
	#print "sent mail: " + msg


def scanShifts(siteIndex):
	r = s.get('https://zed.rutgers.edu/scheduling/open_shifts/'
		+ str(work_sites[siteIndex])
		+ '/?start_date='
		+ zed_date,
		cookies=cookies)
	soup = BeautifulSoup(r.text, 'lxml')
	s_table = soup.find('div', class_='schedule').find('table').find('tbody').find('tr').find_all('td')
	date_counter = -1;
	for cell in s_table:
		shifts = cell.find('div', class_='scheduleShift')
		#if str(cell['class'])[2:-2] == 'first':
		if cell.has_attr("class"):
			date_counter += 1
		if shifts is not None:
			shift_date = date + datetime.timedelta(days=date_counter)
			shift_id = shifts.find('input').attrs['value']
			covered = 0
			for line in f:
				if shift_id in line:
					covered = 1
			if covered == 0:
				f.write(shift_id + '\n')
				time = str(shifts.find('p').contents)[3:-2]
				sendMail("\nOpen shift at "+work_sites_name[siteIndex]+" on "+calendar.day_name[shift_date.weekday()]+ " " + time)
			

for index in range(len(work_sites)):
	scanShifts(index)
server.quit()
