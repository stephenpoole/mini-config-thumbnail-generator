##MINI Config Thumbnail Generator

This project is built with NodeJs, Express & Babel 7.

#Credentials  
The server looks for a configuration file named `credentials.json` which should contain the following:

```
{
    "rackspace": {
        "username": ...,
        "apiKey": ...
    },
    "mailgun": {
        "domain": ...,
        "apiKey": ...
    }
}
```

#Getting Started  
Install the latest version of [nodejs](https://nodejs.org/en/download/).  
`npm install`  
`npm start`

This will start the server on port 3000.
