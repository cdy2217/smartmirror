var config = {
    // Language for the mirror (currently not implemented)
    language : "ko",
    greeting : ["SmartMirror"], // An array of greetings to randomly choose from
    // forcast.io
    forcast : {
        key : "1d633dec848d39bf3581628f7bb2e642", // Your forcast.io api key
        units : "auto" // See forcast.io documentation if you are getting the wrong units
    },
    // Calendar (An array of iCals)
    calendar: {
      icals : ["https://calendar.google.com/calendar/ical/1dmqv0614m7pbsvoo2fhmtmf08%40group.calendar.google.com/public/basic.ics"],
      maxResults: 9, // Number of calender events to display (Defaults is 9)
      maxDays: 365 // Number of days to display (Default is one year)
    },
    traffic: {
      key : "AqKBx67sodvYoqfftfmOWCpUFu4Y2UgCZn48rhAfdtccIXnHz5vHxMvtjYLPlU99", // Bing Maps API Key
      mode : "Transit", // Possibilities: Driving / Transit / Walking
      origin : "Gongneung", // Start of your trip. Human readable address.
      destination : "Gangnam", // Destination of your trip. Human readable address.
      name : "서울과기대", // Name of your destination ex: "work"
      reload_interval : 5 // Number of minutes the information is refreshed
    },
    geoPosition: {
       latitude: 37.63047,
       longitude: 127.090198
    },

    conversation : {
      key: "958cddf8-cfc5-4db1-86f4-b3ccf4e7141a" // SimSim API Key
    },

    youtube: {
      key:"AIzaSyBh0SAxOGTvdzOacRRITdStB1Y9Sb4DYuA"
    },

    subway: {
      key:"636e794a6f6b6a63333667454e5474"
    },
    soundcloud: {
    	key:"5b1e15587e3fe32bf3a4ce719b29999d9"
    }
}
