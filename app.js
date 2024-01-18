const taskController = require('./app/task/taskController');
const notificationController = require('./app/task/notificationController');
const classController = require('./app/task/classController');
const zoomController = require('./app/task/zoomController');
const authentication = require('./app/auth/authentication');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const common = require('./app/lib/database');
const expressSanitizer = require('express-sanitizer');
const helmet = require('helmet');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./app/firebase-adminsdk.json');
const massive = require('massive');
const app = express();
const verifyToken = authentication.verifyToken;

/**
 * Applying Middleware
 */
function applyMiddleware() {
    app.use(cors());
    app.use(expressSanitizer());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(helmet());
    app.use(session({
        secret: common.session_key,
        resave: true,
        saveUninitialized: false
    }));
}

/**
 * Initializing Database using Massive
 */
function initializingDatabase() {
    // noinspection JSUnresolvedFunction
    massive(common.connection_string).then(db => {
        app.set('db', db);
        console.log('db connected!')
    });
}

/**
 * Initializing Firebase admin with the respective database
 */
function initializingApp() {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://cyndi-admin.firebaseio.com"
    });
    app.set('firebaseAdmin', admin);
}

/**
 * Basic Authentication Routes
 */
function authenticationRoutes() {
    //Logging-in an existing user
    app.post('/login', authentication.loginUser); 

    //Registering a new user
    app.post('/register/user', authentication.registerAnyUser);

    //Request OTP for changing password, current sends on email
    // app.post('/request/otp', authentication.requestOTP);

    app.post('/email/otp', taskController.sendMailOTP);
    //changing password
    app.post('/change/password', authentication.changePassword);

    //Logout User
    app.get('/logout', authentication.logoutUser);

    //Check for user's phone number existence for Resetting Password
    app.post('/check/user/existence', authentication.checkUserForForgotPassword);
}

/**
 * FCM Token Related Routes
 */
function fcmRoutes() {
    //Function to get the Firebase Auth token from admin SDK
    app.get('/get/firebase/auth/token', verifyToken, taskController.getFirebaseAuthToken);

    //Saving FCM token used for sending notifications to the database
    app.post('/save/fcm/token', verifyToken, taskController.saveFCMTokens);
}

/**
 * Advance Role Specific Registration Routes
 */
function roleSpecificRegistrationRoutes() {
    //Registering a new student after basic user registration
    app.post('/register/student', verifyToken, authentication.registerStudent);

    //Registering a new teacher after basic user registration
    app.post('/register/teacher', verifyToken, authentication.registerTeacher);

    //Saving specific data of a user based on key and value
    app.post('/save/user/data', verifyToken, authentication.saveUserData);
}

/**
 * Other Role Specific Routes
 */
function roleSpecificRoutes() {
    //Pushing Role based user profile to the frontend
    app.post('/get/role/details', verifyToken, taskController.getRoleBasedUserDetails);

    //Pushing data of other user's profile to the frontend
    app.post('/get/other/user/profile', verifyToken, taskController.getOtherUserProfile);
}

/**
 * Home Feed Related Routes
 */
function homeFeedRoutes() {
    //Pushing home feed posts from the database to the frontend
    app.get('/get/posts', verifyToken, taskController.getPosts);

    //Saving a new home feed post to the database
    app.post('/add/post', verifyToken, taskController.saveNewHomePost);
}

/**
 * Home Feed Drafts Related Routes
 */
function homeFeedDraftsRoutes() {
    //Saving a new home feed draft to the database
    app.post('/add/draft', verifyToken, taskController.saveNewHomeDraft);

    //Function to get all the drafts of a user from the database
    app.post('/get/userdrafts', verifyToken, taskController.getUserDrafts);

    //Deleting saved draft from the database using the draft id and the userid
    // app.post('/delete/draft', authentication.verifyToken, taskController.deleteDraft);

    //Function to update a draft in database
    app.post('/update/draft', verifyToken, taskController.updateDraft);
}

/**
 * Competition Related Routes
 */
function competitionRoutes() {
    //Pushing Competition Details from the database to the frontend
    app.post('/get/competition/details', verifyToken, taskController.getCompetitionDetails);

    //Pushing Competition Entries from the database to the frontend
    app.post('/get/entries', verifyToken, taskController.getEntries);

    //Saving Competition Entry to the database
    app.post('/save/competition/entry', verifyToken, taskController.saveCompetitionEntry);

    //Saving Competition Posts to the database
    app.post('/save/competition/post', verifyToken, taskController.saveCompetitionPost);
}

/**
 * Meeting Related Routes
 */
function meetingRoutes() {
    //Pushing meetings from the database to the frontend
    app.get('/get/meetings', verifyToken, taskController.getMeetings);

    //Saving a new meeting to the database
    app.post('/save/meeting', verifyToken, taskController.saveMeetings);
}

/**
 * Search Related Routes
 */
function searchRoutes() {
    //Function to get all the users from the database
    app.get('/get/allusers', /*verifyToken,*/ taskController.getAllUsers);

    //Function to search student details
    //app.post('/search', authentication.verifyToken, taskController.search);

    //Function to search
    app.post('/search', taskController.search);

    //Function to search resource
    app.post('/search/resource', verifyToken, taskController.resourceSearch);
}

/**
 * Notification Related Routes
 */
function notificationRoutes() {
    //Function to send Notification for a single user using a token
    app.post('/send/notification', verifyToken, notificationController.sendNotificationToUser);

    //Function to send notification to a class using Topic
    app.post('/send/class/notification', verifyToken, notificationController.sendNotificationToClass);
}

/**
 * Diary Related Routes
 */
function diaryRoutes() {
    //Function to save diary details
    app.post('/add/diary', verifyToken, taskController.saveDiary);

    //Function to get diary details
    app.post('/get/diary', verifyToken, taskController.getDiary);
}

/**
 * News Related Routes
 */
function newsRoutes() {
    //Function to add news
    app.post('/add/news', verifyToken, taskController.saveNews);

    //Function to get news
    app.post('/get/news', verifyToken, taskController.getNews);
}

/**
 * Class Related Routes
 */
function classRoutes() {
    //Function to get all the students of a particular semester and course of a college
    app.post('/get/students', verifyToken, classController.getStudents);

    //Function to get Teacher List For Add class
    app.post('/get/teacher/list', verifyToken, classController.getTeacherListForAddClass);

    //Function to get Student List For Add class
    app.post('/get/student/list', verifyToken, classController.getStudentListForAddClass);

    //Function to add class in a college
    app.post('/add/class', verifyToken, classController.addClass);

    //Function to get a teacher's classes
    // app.post('/get/class/teacher', verifyToken, classController.getClassForTeacher);

    //Function to get classes of a user
    app.get('/get/classes', verifyToken, classController.getClasses);

    //Function to get a student's classes
    // app.post('/get/class/student', /*verifyToken, */classController.getClassForStudent);

    //Function to upload a file on S3
    // app.post('/upload/file', verifyToken, taskController.uploadFile);

    //Function to add / update resource
    app.post('/add/resource', verifyToken, classController.addResource);

    //Function to get resource for teacher
    app.post('/get/resource/teacher', verifyToken, classController.getResourceForTeacher);

    //Function to get resource for class
    app.post('/get/resource/class', verifyToken, classController.getResourceForClass);

    //Function to add / update syllabus
    app.post('/add/syllabus', verifyToken, classController.addSyllabus);

    //Function to get syllabus
    app.post('/get/syllabus', verifyToken, classController.getSyllabus);

    //Function to add / update syllabus
    app.post('/add/chapter/plan', verifyToken, classController.addChapterPlan);

    //Function to get syllabus
    app.post('/get/chapter/plan', verifyToken, classController.getChapterPlan);

    //Function to add / update QES
    app.post('/add/activity', verifyToken, classController.addActivity);

    //Function to get QES
    app.post('/get/qes', verifyToken, classController.getQES);

    //Function to get P&A
    app.post('/get/panda', verifyToken, classController.getPANDA);

    //Function to submit answer to an activity
    app.post('/submit/activity/answer', verifyToken, classController.submitActivityAnswer);

    //Function to get submissions of an activity
    app.post('/get/submission', verifyToken, classController.getSubmission);

    //Function to get submissions of an activity
    app.post('/get/class/code', verifyToken, classController.getClassForCode);

    //Function to get submissions of an activity
    app.post('/add/student/class', verifyToken, classController.addStudentInClass);
}

/**
 * Zoom Related Routes
 */
function zoomRoutes() {
    //Function to add a zoom host
    app.post("/add/zoom/host", verifyToken, zoomController.addZoomHost);

    //Function to get a zoom host
    app.post("/get/zoom/host", verifyToken, zoomController.getZoomHost);

    //Function to delete a zoom host
    app.post("/delete/zoom/host", verifyToken, zoomController.deleteZoomHost);

    //Function to get zoom credentials
    app.post('/get/zoom/credentials', verifyToken, zoomController.getZoomCredentials);

    //Function to initialize zoom
    app.post('/initialize/zoom', verifyToken, zoomController.initializeZoomMeeting);

    //Function to get zoom meeting recording
    app.post('/get/meeting/recording', /*verifyToken,*/ zoomController.getZoomMeetingRecording);
}

/**
 * Educational Fragment Related routes
 */
function notificationFragmentsRoutes() {
    //Function to get data of Educational Notifications
    app.post('/get/notification/education', verifyToken, taskController.getEducationNotifications);

    //Function to save or add an Educational notification by the Teacher
    app.post('/add/notification/education', verifyToken, taskController.addEducationNotifications);
}

function liveClassRoutes() {
    app.post('/get/live/classes/student', verifyToken, taskController.getLiveClassesForStudent);

    app.post('/get/live/classes/teacher', verifyToken, taskController.getLiveClassesForTeacher);

    app.post('/add/live/class', verifyToken, taskController.addLiveClasses);

    app.post("/test/notification", /*verifyToken,*/ notificationController.testNotification);
}

/**
 * Group related routes
 */
function groupRoutes() {
    //API to add a new group on the database
    app.post("/add/group", verifyToken, taskController.addGroup);
    //API to get all the groups a user is part of
    app.get("/get/groups", verifyToken, taskController.getGroups);
}


function masterRole() {
    app.post("/masterRole", taskController.masterRole);
}


function masterdata() {
    app.post("/getCourse", taskController.getCourse);
    app.post("/getUnivercity", taskController.getUnivercity);
    app.post("/getCollage", taskController.getCollage);
    app.post("/getSemester", taskController.getSemester);
    app.post("/getSubject", taskController.getSubject);
}

/**
 * Calling all the functions which consist routes.
 */
applyMiddleware();
initializingDatabase();
initializingApp();
authenticationRoutes();
fcmRoutes();
roleSpecificRegistrationRoutes();
roleSpecificRoutes();
homeFeedRoutes();
homeFeedDraftsRoutes();
competitionRoutes();
meetingRoutes();
searchRoutes();
notificationRoutes();
diaryRoutes();
newsRoutes();
classRoutes();
zoomRoutes();
notificationFragmentsRoutes();
liveClassRoutes();
groupRoutes();
masterRole();
masterdata();

/**
 * Starting the server.
 */
app.listen(common.server_port, () => {
    console.log('Server Started');
});
