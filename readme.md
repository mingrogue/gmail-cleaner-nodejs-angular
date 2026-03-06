1. This is a repository to clean your Gmail

3. Steps to run your gamil cleaner - 
     - create an app in the google console. (follow this google doc - https://docs.cloud.google.com/iam/docs/service-accounts-create)
     - go to app and create a service account and download the service account.
     - enable the gmail api in your app.
     - go to console and search for Google Auth Platform, enter Google Auth Platform.
     - add a client by selecting your app.
     - add redirect url of your nodejs backend application http://localhost:3000/token/.
     - get the clinet id and client secret from the google console.
     -  FRONT_END_URL=http://localhost:4200
        GMAIL_BASRE_API_URL=https://gmail.googleapis.com/
        GOOGLE_CLIENT_ID=********
        GOOGLE_CLIENT_SECRET=********
        REDIRECT_URL=http://localhost:3000/token/
        MONGO_URI=********
        RABBITMQ_URI=amqp://user:bitnami@localhost:5672
       create .env files with these secrets.
     - install all the node js applications.
     - install docker and docker-compose.
     - run npm start inside the backend and frontend projects.
     - go to root project directory and run docker-compose up.


5. **** Note. after clicking "Delete selected emails given by you" button, please refresh the page ****
5. The number of emails deleted will be shown in the screen at the bottom.