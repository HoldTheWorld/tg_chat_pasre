# tg_chat_pasre

This simple Telegram bot is created to parse messages in a chat for some specific values (e.g., article numbers), collect these values, and send a report with the gathered information via email. 
To search for values, it is necessary to specify a regular expression in a ARTICLE_REGEX variable. 
The email sending time is specified in SCHEDULE_TIME variable. 
To send data for the past day, set the value SCAN_TODAY=false.
