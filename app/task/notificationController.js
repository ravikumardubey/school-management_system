/**
 * Setting up the options of the firebase notification
 * @type {{timeToLive: number, priority: string}}
 */
const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24
};
const common = require('../lib/database');
require('body-parser');
const parseJson = require('parse-json');

/**
 * This function notifies only one user whom the notification has to be sent.
 * It creates the payload as per the notification type and sends it through notifyUser().
 * @param req
 * @param res
 */
const sendNotificationToUser = async (req, res) => {
    let db = req.app.get('db');
    let uid = req.sanitize(req.headers['user_id']);
    let type = req.sanitize(req.body.type);
    let photoUrl = req.sanitize(req.body.photoUrl);
    let name = req.sanitize(req.body.name);
    let receiverId = req.sanitize(req.body.receiverId);

    let payload = {};
    if (type === "Message") {
        let message = req.sanitize(req.body.message);

        payload = {
            data: {
                senderId: "" + uid, // This is because Firebase doesn't support BigInteger
                type: "" + type,
                name: "" + name,
                body: "" + message,
                photoUrl: "" + photoUrl
            }
        };
    } else if (type === "Calling") {
        let status = req.sanitize(req.body.status);
        payload = {
            data: {
                senderId: "" + uid,
                type: "" + type,
                name: "" + name,
                status: "" + status,
                photoUrl: "" + photoUrl
            }
        }

    } else if (type === "Activity") {
        let activityId = req.sanitize(req.body.activity_id);
        let activityName = req.sanitize(req.body.activity_name);
        payload = {
            data: {
                senderId: "" + uid,
                type: "" + type,
                name: "" + name,
                activityId: "" + activityId,
                photoUrl: "" + photoUrl,
                activityName: "" + activityName
            }
        }
    }

    const firebaseAdmin = req.app.get('firebaseAdmin');
    await notifyUser(db, receiverId, firebaseAdmin, payload, (message) => {
        res.status(200).end(message);
    });
};

/**
 * This function sends a notification to a single user and it takes the input from
 * sendNotificationToUser().
 * @param db - Database object to get the token of the receiver
 * @param receiverId - Receiver ID to find the token from the database.
 * @param firebaseAdmin - FirebaseAdmin to send the notification.
 * @param payload - Payload to be sent with the notification
 * @param callback - Callback to notify when the notification is sent.
 */
const notifyUser = async (db, receiverId, firebaseAdmin, payload, callback) => {
    const receiver = await db.getUserById({id: receiverId});
    if (receiver.length > 0) {
        const result = await db.getFcmTokenById({receiver_id: receiverId});
        console.log(result);
        if (!result.empty && result.length > 0) {
            const token = result[0].fcm_token;

            firebaseAdmin.messaging().sendToDevice(token, payload, options)
                .then(function (response) {
                    console.log('Successfully sent message:', response);
                    console.log(response.successCount);
                    console.log(response.failureCount);
                    if (response.successCount > 0) {
                        callback('Sent');
                    } else {
                        callback('Not Sent');
                    }
                })
                .catch(function (error) {
                    console.log('Error sending message:', error);
                    callback('Not Sent. Error');
                });
        } else {
            callback('No Token found');
        }
    } else {
        callback('No User found');
    }
};

/**
 * API used to send notification to a class.
 * First, it uses fetchClassTokens to gather all the tokens associated with the class.
 * Second, it uses subscribeToTopic to subscribe all the tokens with the class name as the Topic.
 * Finally, it uses notifyTopic to send the notification.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const sendNotificationToClass = async (req, res) => {
    const db = req.app.get('db');
    const admin = req.app.get('firebaseAdmin');
    const user_id = req.sanitize(req.headers['user_id']);
    const class_id = req.sanitize(req.body.class_id);
    const class_name = req.sanitize(req.body.class_name);
    const teacher_name = req.sanitize(req.body.teacher_name);
    const type = req.sanitize(req.body.type);
    const photo_url = req.sanitize(req.body.photo_url);

    switch (type) {
        case 'LiveClass': {
            const meeting_no = req.sanitize(req.body.meeting_no);
            const description = req.sanitize(req.body.description);
            let message = {
                teacher_id: "" + user_id,
                class_id: "" + class_id,
                class_name: "" + class_name,
                teacher_name: "" + teacher_name,
                type: "" + type,
                photo_url: "" + photo_url,
                description: "" + description,
                meeting_no: "" + meeting_no
            };
            res.status(200).send('Notification sent');
            //await notifyTopic(class_name.replace(/\s+/g, ''), message, admin);
            await fetchClassTokens(message, admin, db);
            break;
        }
        case 'ClassNotification': {
            const description = req.sanitize(req.body.description);
            let message = {
                teacher_id: "" + user_id,
                class_id: "" + class_id,
                class_name: "" + class_name,
                teacher_name: "" + teacher_name,
                type: "" + type,
                photo_url: "" + photo_url,
                description: "" + description
            };
            res.status(200).send('Notification sent');
            //await notifyTopic(class_name.replace(/\s+/g, ''), message, admin);
            await fetchClassTokens(message, admin, db);
            break;
        }
        case 'ClassBoard': {
            const message1 = req.sanitize(req.body.message);
            let message = {
                teacher_id: "" + user_id,
                class_id: "" + class_id,
                class_name: "" + class_name,
                teacher_name: "" + teacher_name,
                type: "" + type,
                photo_url: "" + photo_url,
                message: "" + message1
            };
            // console.log(message);
            res.status(200).send('Notification sent');
            //await notifyTopic(class_name.replace(/\s+/g, ''), message, admin);
            await fetchClassTokens(message, admin, db);
            break;
        }
        default:
            res.status(201).end(common.try_again);
            break;
    }
};

const sendNotificationToGroup = async (req, res) => {
    const db = req.app.get('db');
    const admin = req.app.get('firebaseAdmin');
    const group_name = req.sanitize(req.body.group_name);
    const group_id = req.sanitize(req.body.group_id);
    const user_id = req.sanitize(req.body.user_id);
    const type = req.sanitize(req.body.type);
    const message = req.sanitize(req.body.message);
    const photo_url = req.sanitize(req.body.photo_url);
    const user_name = req.sanitize(req.body.user_name);

    let messageToBeSent = {
        group_name: "" + group_name,
        group_id: "" + group_id,
        user_id: "" + user_id,
        type: "" + type,
        message: "" + message,
        photo_url: "" + photo_url,
        user_name: "" + user_name
    };

    await fetchGroupTokens(messageToBeSent, admin, db);

};

const notifyTopic = async (topicSubscribedTo, messageToBeSent, admin) => {
    let message = {
        data: messageToBeSent,
        topic: topicSubscribedTo
    };
    let status = "";
    await admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message to ' + topicSubscribedTo + ':', response);
            status = 'On Success';
        })
        .catch((error) => {
            console.log('Error sending message to ' + topicSubscribedTo + ':', error);
            status = 'On Error';
        });
    return status;
};

const subscribeToTopic = async (tokens, topic, admin) => {
    let status = "";
    await admin.messaging().subscribeToTopic(tokens, topic)
        .then(function (response) {
            console.log('Successfully subscribed to topic:', response);
            status = 'On Success';
        })
        .catch(function (error) {
            console.log('Error subscribing to topic:', error);
            status = 'On Error';
        });
    return status;
};

const unSubscribeToTopic = async (tokens, topic, admin) => {
    admin.messaging().unsubscribeFromTopic(tokens, topic)
        .then(function (response) {
            console.log('Successfully unsubscribed from topic:', response);
        })
        .catch(function (error) {
            console.log('Error unsubscribing from topic:', error);
        });
};

const fetchGroupTokens = async (message, admin, db) => {
    let groupName = message.group_name.replace(/\s+/g, '');
    let group_id = message.group_id;
    let response = await db.getUsersFromGroup({group_id});
    if (response.length > 0) {
        let tokenList = [];
        let usersIdList = [];
        let participantsList = response[0]['group_participants']['participants'];

        for (let i in participantsList) {
            usersIdList.push(participantsList[i]['user_id']);
        }

        for (let i in usersIdList) {
            let token = await db.getFCMTokens({id: usersIdList[i]});
            if (token.length > 0) {
                tokenList.push(token[0]['fcm_token']);
            }
        }

        subscribeToTopic(tokenList, groupName, admin).then(value => {
                notifyTopic(groupName, message, admin);
            }
        );
    }
};

const fetchClassTokens = async (message, admin, db) => {
    let className = message.class_name.replace(/\s+/g, '');
    const user_id = message.teacher_id;
    const class_id = message.class_id;
    let response = await db.getTeachersAndStudentListByClassID({class_id});
    if (response.length > 0) {
        let tokenList = [];
        let usersIdList = [];
        let peopleList = [...parseJson(response[0].students_list)['users']];
        peopleList.push(...parseJson(response[0].teachers_list)['users']);

        for (let i = 0; i < peopleList.length; i++) {
            const onePersonID = parseJson(peopleList[i])['user_id'];
            usersIdList.push(onePersonID)
        }

        for (let i = 0; i < usersIdList.length; i++) {
            const id = usersIdList[i];
            const tokenResponse = await db.getFCMTokens({id});
            if (tokenResponse.length > 0) {
                const oneToken = tokenResponse[0]['fcm_token'];
                if (oneToken.length > 50) {
                    tokenList.push(oneToken);
                }
            }
        }

        subscribeToTopic(tokenList, className, admin).then(value => {
                notifyTopic(className, message, admin);
            }
        );
    }
};

const testNotification = async (req, res) => {
    const db = req.app.get('db');
    const admin = req.app.get('firebaseAdmin');
    let class_name = "Machine learning";
    let message = {
        teacher_id: "65",
        class_id: "36",
        class_name: "Machine learning",
        teacher_name: "Dr. Vishal Puri",
        type: "ClassNotification",
        photo_url: "Profile_Pictures/vishalpuri.jpg",
        description: "This is a sample description",
        meeting_no: "1212121212"
    };

    let groupMessage = {
        group_id: "20",
        group_name: "Test Group",
    };

    const name = class_name.split(/\s+/);
    let topic = '';
    for (let i = 0; i < name.length; i++) {
        topic += name[i];
    }
    //fetchClassTokens(message, admin, db);
    fetchGroupTokens(groupMessage, admin, db);

    //let users = await db.getAllTokens();
    /*res.status(200).send("Notifications sent");
    sendNotificationToTopic(topic, message, admin);*/

    /*if (!users.empty) {
        let tokens = [];
        for (let i = 0; i < users.length; i++) {
            console.log(users[i].fcm_token);
            tokens.push(users[i].fcm_token);
        }
        /!*subscribeToTopic(tokens, topic, admin).then(value => {

                console.log(value);
                //sendNotificationToTopic("Machine learning", message, admin)
            }
        );*!/

    }*/
};

module.exports = {
    sendNotificationToUser,
    notifyUser,

    sendNotificationToClass,
    fetchClassTokens,

    sendNotificationToGroup,
    fetchGroupTokens,

    subscribeToTopic,
    notifyTopic,

    testNotification
};