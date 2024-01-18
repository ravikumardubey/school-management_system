const pool = require('../lib/database').connection;
const common = require('../lib/database');
const parseJson = require('parse-json');
const http = require("https");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const isEmpty = require('is-empty');
const mailer = require('nodemailer');
require('body-parser');
const {fetchGroupTokens, fetchClassTokens} = require('./notificationController');

//Function to notify user through Email
function saveID(user_id, email) {
    const unique_id = uuid.v4();
    const text = 'INSERT INTO public.temp_registration_id(user_id, unique_id, created_at, updated_at) VALUES ($1, $2, now(), now());';
    const values = [user_id, unique_id];

    pool.query(text, values, (error) => {
        if (error) {
            console.log('Query error ' + error);
        } else {
            const body = 'Hello, ' + unique_id + ' is your unique registration code generated temporarily to continue registration in case it fails or you are unable to complete it. You can use this code to continue your registration.';
            let transport = mailer.createTransport({
                host: 'smtpout.asia.secureserver.net',
                port: 465,
                auth: {
                    user: 'admin@cyndi.in',
                    pass: 'Admingd2020%'
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            const message = {
                from: 'Cyndi Tech <admin@cyndi.in>', // Sender address
                to: email,         // List of recipients
                subject: 'Temporary registration ID', // Subject line
                text: body // Plain text body
            };
            transport.sendMail(message, function (err) {
                if (err) {
                    console.log(err)
                } else {
                    console.log('Message sent: ' + message);
                }

            });
        }
    });
}

/**
 * This function returns the user details of specific role like Teacher, Student etc
 * First this checks the passes role and based on that, returns a JSON of the response got from the query.
 * param user_id - This is the user id of the user who's accessing the data.
 * param role - This is the role of the user who's accessing the data.
 */
const getRoleBasedUserDetails = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);
    let role = parseInt(req.sanitize(req.body.role));

    if (user_id && role) {

        switch (role) {
            case common.roleStudent : {
                let response = await db.getStudentDetails({user_id});
                if (!response.empty && response.length > 0) {
                    delete response[0]['encrypted_password'];
                    delete response[0]['salt'];
                    delete response[0]['created_at'];
                    delete response[0]['updated_at'];
                    res.status(200).end(JSON.stringify(response));
                } else {
                    res.status(201).end('No such user')
                }
                break;
            }
            case common.roleTeacher: {
                let response = await db.getTeacherDetails({user_id});
                if (response.length > 0) {
                    res.status(200).end(JSON.stringify(response))
                } else {
                    res.status(201).end('No such user')
                }
                break;
            }
            default : {
                res.status(201).end("Invalid Role, try again")
            }
        }

    } else {
        res.status(201).json(common.try_again)
    }
};

/**
 * This function saves a new home post of the home feed.
 * It checks the data passed and then store the data into the database.
 * param user_id - This is the user id of the user who's creating the new home feed post.
 * param post_images - This is the list of images' URL of the new home feed post.
 * param post_body - This is the caption/text of the new home feed post.
 * param post_video - This is the video's link of the new home feed post.
 */
const saveNewHomePost = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);
    const post_images = req.sanitize(req.body.post_images);
    const post_body = req.sanitize(req.body.post_body);
    const post_video = req.sanitize(req.body.post_video);

    if (user_id) {
        let response = await db.addHomeFeedPost({user_id, post_body, post_video, post_images,});
        if (!response.empty) {
            res.status(200).end('Post added successfully');
        } else {
            res.status(201).end('Server Error, Try Again');
        }
    } else {
        res.status(201).json(common.try_again)
    }
};

/**
 * This function stores drafts added by the user for future access into the database
 * It takes four parameters :
 * param user_id - This is the user id of the user who's saving the draft.
 * param post_images - This is the list of images' URL of the draft.
 * param post_body - This is the caption/text of the draft.
 * param post_video - This is the video's link of the draft.
 */
const saveNewHomeDraft = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);
    const draft_body = req.sanitize(req.body.draft_body);
    const draft_images = req.sanitize(req.body.draft_images);
    const draft_video = req.sanitize(req.body.draft_video);

    if (user_id && draft_body) {
        let response = await db.addDraft({user_id, draft_body, draft_images, draft_video});
        if (!response.empty) {
            res.status(200).end('Draft saved')
        } else {
            res.status(201).end('Adding draft failed')
        }
    } else {
        res.status(201).json(common.try_again)
    }
};

/**
 * This function returns a json response of the drafts stored in the database of user.
 * param user_id - This is the user id of the user who's accessing the draft.
 */
const getUserDrafts = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);

    if (user_id) {
        let response = await db.getUserDrafts({user_id});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response))
        } else {
            res.status(201).end('No Drafts')
        }
    } else {
        res.status(201).json(common.try_again)
    }
};

/**
 * This function deletes any previously saved draft from the database.
 * param user_id - This is the user id of the user who's deleting the draft.
 * param draft_id - This is the draft_id of the draft which is being deleted.
 */
const deleteDraft = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);
    let draft_id = req.sanitize(req.body);

    if (user_id && draft_id) {
        let response = await db.deleteUserDraft({user_id, draft_id});
        if (!response.empty) {
            res.status(200).end('Deleting draft successful');
        } else {
            res.status(201).end('No such Draft')
        }
    } else {
        res.status(201).json(common.try_again)
    }
};

/**
 * This function updates the user's draft but first it checks whether such draft is saved on the database
 * or not. If it's there, it updates the draft's values as the passed values.
 * It takes five parameters :
 * param user_id - This is the user id of the user who's saving the draft.
 * param draft_id - This is the draft_id of the draft which is being updated.
 * param post_images - This is the list of images' URL of the updated draft.
 * param post_body - This is the caption/text of the updated draft.
 * param post_video - This is the video's link of the updated draft.
 */
const updateDraft = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);
    const draft_id = req.sanitize(req.body.draft_id);
    const draft_body = req.sanitize(req.body.draft_body);
    const draft_images = req.sanitize(req.body.draft_images);
    const draft_video = req.sanitize(req.body.draft_video);

    if (user_id && draft_id && draft_body) {
        let response = await db.updateUserDraft({user_id, draft_id, draft_body, draft_images, draft_video});
        if (!response.empty) {
            res.status(200).end('Updating draft successful');
        } else {
            res.status(201).end('No such Draft');
        }
    } else {
        res.status(201).json(common.try_again);
    }
};

//This function is to complete the final phase of registration process of student
const checkID = (req, res) => {
    // accessing the data in request body
    const post_data = req.body;

    const temp_id = post_data.id;

    const text = 'SELECT profile_user.* FROM public.profile_user, public.temp_registration_id where profile_user.id = public.temp_registration_id.user_id and public.temp_registration_id.unique_id = $1;';
    const values = [temp_id];

    if (temp_id) {
        pool.query(text, values, (error, results) => {
            if (error) {
                console.log('[PG Error]', error);
                res.status(201).end('Server Error, Try Again');
                throw error
            } else {
                if (results && results.rows.length) {
                    res.status(200).end(JSON.stringify(results.rows[0]));
                } else {
                    res.status(200).end('No Such user exists');
                }
            }
        })
    } else {
        res.status(201).end(common.try_again);
    }
};

/**
 * This function is used to save a competition post posted by the teacher in the database.
 * It takes many parameters :
 * param competition_category - This is the competition's category like Dance, Music etc.
 * param competition_level - This is the competition's level like National, State, Inter-college etc
 * param competition_title - This is the competition's title, length - 70 words
 * param competition_photo_url - This is the URL of competition's banner image
 * param competition_body - This is the description of the competition.
 * param competition_document_url - This is the URL of the document uploaded by the teacher
 * param date_of_entry_open - This is the date of when entry are opened of the competition.
 * param date_of_entry_close - This is the date of when entry are closed of the competition.
 * param date_of_competition :This is the date of when competition takes place.
 * param date_of_result - This is the date of when result are announced.
 * param collaborators - This is the list of collaborators of the competition.
 * param sponsors - This is the list of sponsors of the competition.
 * param competition_type - This is the competition type like open, closed, selective
 * param no_of_team_members - This is range of team members that can apply in the competition as (n-1) - n
 * param user_id - This is the user_id of the teacher who's creating the competition.
 * param entry_format_json - This is a boolean json of the selected file types of the entry like image, doc etc.
 */
const saveCompetitionPost = async (req, res) => {
    // accessing the data in request body
    const post_data = req.sanitize(req.body);
    let user_id = req.sanitize(req.headers['user_id']);
    const competition_category = post_data.competition_category;
    const competition_level = post_data.competition_level;
    const competition_title = post_data.competition_title;
    const competition_photo_url = post_data.competition_photo_url;
    const competition_body = post_data.competition_body;
    const competition_document_url = post_data.competition_document_url;
    const date_of_entry_open = post_data.date_of_entry_open;
    const date_of_entry_close = post_data.date_of_entry_close;
    const collaborators = post_data.collaborators;
    const sponsors = post_data.sponsors;
    const competition_type = post_data.competition_type;
    const no_of_team_members = post_data.no_of_team_members;
    const date_of_competition = post_data.date_of_competition;
    const date_of_result = post_data.date_of_result;
    const user_id_big_int = BigInt(user_id);
    const entry_format_json = post_data.entry_format_json;

    const text = 'INSERT INTO public.competition_post(user_id, competition_category, competition_level, competition_title, competition_photo_url, competition_body, competition_document_url, date_of_entry_open, date_of_entry_close, collaborators, sponsors, competition_type, no_of_team_members, created_at, updated_at, date_of_competition, date_of_result, entry_format_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), $14, $15, $16) returning competition_title, competition_id;';
    const values = [user_id_big_int, competition_category, competition_level, competition_title, competition_photo_url, competition_body, competition_document_url, date_of_entry_open, date_of_entry_close, collaborators, sponsors, competition_type, no_of_team_members, date_of_competition, date_of_result, entry_format_json];

    if (competition_category &&
        competition_level &&
        competition_title &&
        competition_body &&
        date_of_entry_open &&
        date_of_entry_close &&
        competition_type &&
        no_of_team_members &&
        user_id_big_int &&
        entry_format_json) {
        pool.query(text, values, (error, results) => {
            if (error) {
                res.status(201).end('Server Error, Try Again');
                throw error
            } else {
                res.status(200).json('Competition successfully posted');
                //TODO sendNotificationToAll(results.rows[0].competition_title, results.rows[0].competition_id, 'Competition')
            }
        });
    } else {
        res.status(201).end(common.try_again);
    }
};

/**
 * This function is used to save a competition entry posted by the applicant in the database.
 * It takes many parameters :
 * param competition_id - This is the competition id in which the applicant is applying.
 * param entry_title - This is the entry's title, length - 70 words
 * param entry_photo_url - This is the URL of entry's photo URL.
 * param entry_video_url - This is the URL of entry's video URL.
 * param entry_description - This is the description of the entry.
 * param entry_document_url - This is the URL of the document uploaded by the applicant.
 * param no_of_team_members - This is range of team members of the team applying (n-1) - n (1-1 in case of individual).
 * param team_name - This is the team name of the applicant.
 * param team_members - This is the list of all the team members.
 * param user_id - This is the user_id of the user who's applying in the competition.
 */
const saveCompetitionEntry = async (req, res) => {
    const post_data = req.sanitize(req.body);

    let user_id = req.sanitize(req.headers['user_id']);
    const competition_id = post_data.competition_id;
    const entry_title = post_data.entry_title;
    const entry_description = post_data.entry_description;
    const entry_video_url = post_data.entry_video_url;
    const entry_document_url = post_data.entry_document_url;
    const entry_photo_url = post_data.entry_photo_url;
    const no_of_team_members = post_data.no_of_team_members;
    const team_name = post_data.team_name;
    const team_members = post_data.team_members;

    const user_id_big_int = BigInt(user_id);
    const competition_big_int = BigInt(competition_id);


    const text = 'INSERT INTO public.competition_entries(user_id, competition_id, entry_title, entry_description, entry_video_url, entry_document_url, entry_photo_url, no_of_team_members, team_name, created_at, updated_at, name_of_team_members) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10);';
    const values = [user_id_big_int, competition_big_int, entry_title, entry_description, entry_video_url, entry_document_url, entry_photo_url, no_of_team_members, team_name, team_members];

    if (user_id_big_int &&
        competition_big_int &&
        entry_title &&
        entry_description &&
        no_of_team_members) {
        pool.query(text, values, (error, results) => {
            if (error) {
                res.status(201).end('Server Error, Try Again');
                throw error
            } else {
                res.status(200).json('Competition successfully posted');
                //TODO sendNotificationToAll(results.rows[0].entry_title, results.rows[0].competition_id, 'Competition');
            }
        });
    } else {
        res.status(201).end(common.try_again);
    }
};

/**
 * This function is used to get single or multiple competitions.
 * param quantity - all or nothing/one
 * In case of single competition :
 * param comp_id - competition id of competition whose data is being accessed.
 */
const getCompetitionDetails = async (req, res) => {
    const post_data = req.sanitize(req.body);
    const quantity = post_data.how_many_needed;
    const comp_id = post_data.comp_id;

    let queryText;
    let values = [];
    if (quantity === 'All') {
        queryText = 'SELECT profile_user.id, profile_user.name, profile_user.photo_url, profile_teacher.university_name, competition_post.* FROM public.profile_user , public.profile_teacher, public.competition_post WHERE  profile_user.id = competition_post.user_id and profile_user.id = profile_teacher.user_id;';
    } else {
        queryText = 'SELECT profile_user.id, profile_user.name, profile_user.photo_url, profile_teacher.university_name, competition_post.* FROM public.profile_user , public.profile_teacher, public.competition_post WHERE  competition_post.competition_id = $1 and profile_user.id = competition_post.user_id and profile_user.id = profile_teacher.user_id;';

        values = [comp_id]
    }

    pool.query(queryText, values, (error, results) => {
        if (error) {
            console.log('[PG Error]', error);
            res.status(201).end('Server Error, Try Again');
            throw error
        } else {
            if (results && results.rows.length) {
                res.status(200).end(JSON.stringify(results.rows));
            } else {
                res.status(201).json('No competitions found');
            }
        }
    });
};

/**
 * This functions is used to get all the posts stored in the database
 */
const getPosts = async (req, res) => {
    const db = req.app.get('db');
    let response = await db.getPosts();
    if (response.length > 0) {
        res.status(200).end(JSON.stringify(response));
    } else {
        res.status(201).end('No posts found');
    }
};

/**
 * This function is used to return the competition entries of a particular competition.
 * This takes these as the parameters:
 * param comp_id - This is the competition's id whose entries are being fetched.
 */
const getEntries = async (req, res) => {
    const post_data = req.sanitize(req.body);
    const comp_id = post_data.comp_id;
    const queryText = 'SELECT profile_user.id, profile_user.name, profile_user.photo_url, profile_teacher.university_name, competition_entries.* FROM public.profile_user , public.profile_teacher, public.competition_entries, public.competition_post WHERE  profile_user.id = competition_post.competition_id and profile_user.id = profile_teacher.user_id and competition_entries.competition_id = $1;';
    const values = [comp_id];

    if (comp_id) {
        pool.query(queryText, values, (error, results) => {
            if (error) {
                console.log('[PG Error]', error);
                res.status(201).end('Server Error, Try Again');
                throw error
            } else {
                if (results && results.rows.length) {
                    res.status(200).end(JSON.stringify(results.rows));
                } else {
                    res.status(201).json('No entries found');
                }
            }
        });
    } else {
        res.status(201).end(common.try_again);
    }
};

/**
 * This function is to retrieve the data of other user's profile when user opens someone's else profile.
 * It checks the user_id if it exists, if yes then this returns data of the particular user from the respective table.
 * param user_id - This is the user_id of the user whose data is being accessed.
 */
const getOtherUserProfile = async (req, res) => {
    let user_id = req.sanitize(req.body.otherUserId);
    if (user_id) {
        pool.query('select role from public.profile_user where id=$1', [user_id], (error, results) => {
            if (error) {
                console.log('[PG Error]', error);
                res.status(400).json(common.try_again);
                throw error
            } else {
                if (results.rows && results.rows.length) {
                    const savedRole = parseInt(results.rows[0].role);
                    let query;
                    switch (savedRole) {
                        case common.roleStudent:
                            query = 'select * from public.profile_user, public.profile_student where profile_student.user_id = $1 and profile_user.id = $1';
                            break;
                        case common.roleTeacher:
                            query = 'select * from public.profile_user, public.profile_teacher where profile_teacher.user_id = $1 and profile_user.id = $1';
                            break;
                        case common.roleGuest:
                            query = 'select * from public.profile_user, public.profile_guest where profile_guest.user_id = $1 and profile_user.id = $1';
                            break;
                        default:
                            res.status(201).end('No such user');
                    }
                    pool.query(query, [user_id], (error, results) => {
                        if (error) {
                            console.log('[PG Error]', error);
                            res.status(400).json(common.try_again);
                            throw error
                        } else {
                            if (results.rows && results.rows.length) {
                                res.status(200).end(JSON.stringify(results.rows[0]));
                            } else {
                                res.status(201).end('No such user');
                            }
                        }
                    })

                } else {
                    res.status(201).json('No such user');
                }
            }
        })
    } else {
        res.status(201).end(common.try_again);
    }
};

function sendMail(name, email, password, errorCallback, successCallback) {

    const otp = Math.floor(1000 + Math.random() * 9000);
    const body = 'Hi ' + name + ',\n\n' + password + ' is your automatically generated account password for Cyndi. You\'ll be prompted to change it when you login for the first time. \n\nThank you. \n\nRegards,\nAdmin,\nCyndi Technologies \n\n\nThis is an automatically generated email. Please don\'t reply to this email';

    let transport = mailer.createTransport(common.mailer_string);

    const message = {
        from: 'Cyndi Tech <admin@cyndi.in>',
        to: [email],
        subject: 'Your account password for Cyndi - Your Techy Assistant',
        text: body
    };

    transport.sendMail(message, function (err, info) {
        if (err) {
            console.log(err);
            errorCallback();
        } else {
            console.log(info);
            successCallback();
        }
    });
}


const sendMailOTP = (req, res) => {
    const name = req.sanitize(req.body.name);
    const email = req.sanitize(req.body.email);

    const otp = Math.floor(1000 + Math.random() * 9000);
    const body = 'Hi ' + name + ',\n\n' + otp + ' is your One Time Password for online mail verification ';

    let transport = mailer.createTransport(common.mailer_string);

    const message = {
        from: 'Cyndi Tech <admin@cyndi.in>',
        to: [email],
        subject: 'OTP for Cyndi - Your Techy Assistant',
        text: body
    };

    transport.sendMail(message, function (err, info) {
        if (err) {
            console.log(err);
            //errorCallback();
        } else {
            console.log(info);
            console.log(otp);
            res.status(200).json({otp: otp});
            //successCallback();
        }
    });

}
/**
 * This function saves the FCM token of a device in the database to use for cloud notification.
 * param user_id - This is the user id of the user whose token is being saved.
 * param user_token - This is the device's token which has to be saved.
 */
const saveFCMTokens = async (req, res) => {
    const user_id = req.sanitize(req.headers['user_id']);
    const user_token = req.sanitize(req.body.user_token);
    const db = req.app.get('db');
    if (user_id && user_token) {
        let result = await db.insertOrUpdateFcmToken({user_id, user_token});
        if (!result.empty) {
            res.status(200).end('Token updated successfully');
        } else {
            res.status(201).end('Failed to update Token');
        }
    } else {
        res.status(201).end('Invalid Details');
    }
};

/*function sendNotificationToAll(title, competition_id, type_of_competition) {
    let token = '';
    const payload = {
        data: {
            competition_id: competition_id,
            type_of_competition: type_of_competition
        },
        notification: {
            title: 'New competition has been added',
            body: title
        }
    };

    pool.query('select token from public.fcm_token', (error, results) => {
        if (error) {
            console.log('Server Error');
        } else {
            if (results && results.rows.length) {
                console.log(JSON.stringify(results.rows));
                const parseJsonAsync = (jsonString) => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(JSON.parse(jsonString))
                        })
                    })
                };
                parseJsonAsync(JSON.stringify(results.rows))
                    .then(jsonData => {
                        jsonData.forEach(async i => {
                            token = i.token;
                            admin.messaging().sendToDevice(token, payload, options)
                                .then(function (response) {
                                    console.log('Successfully sent message:', response);
                                })
                                .catch(function (error) {
                                    console.log('Error sending message:', error);
                                });
                        })
                    })
            }
        }
    });


}*/

/**
 * This function fetches all the meetings from the database and returns it to the user as a json
 * It takes no parameters.
 */
const getMeetings = async (req, res) => {
    const db = req.app.get('db');
    let response = await db.getMeetings();
    if (response.length > 0) {
        res.status(200).json(response);
    } else {
        res.status(201).end('No meetings found!')
    }
};

/**
 * This function saves the new meetings to the database.
 * It takes four parameters:
 * param user_id - This is the user_id of the user who's creating the meeting.
 * param title - This is the title of the meeting.
 * param description - This is the description of the meeting.
 * param level - This is the level of the meeting like closed, open, college, class etc.
 */
const saveMeetings = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);
    const title = req.sanitize(req.body.title);
    const description = req.sanitize(req.body.description);
    const level = req.sanitize(req.body.level);

    if (user_id && title && level) {
        let response = await db.saveMeeting({user_id, title, description, level});
        if (!response.empty) {
            res.status(200).end('Meeting added successfully');
        } else {
            res.status(201).end('Adding meeting failed');
        }
    } else {
        res.status(201).json(common.try_again);
    }
};

/**
 * This function returns all the users from the database to the user.
 * This is used to list users in case of Messaging etc where user needs to access who's available on the platform.
 */
const getAllUsers = async (req, res) => {
    const db = req.app.get('db');
    const limit = req.sanitize(req.headers.limit);
    const offset = req.sanitize(req.headers.offset);

    let response = await db.getAllUsers({limit, offset});
    if (response) {
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end(JSON.stringify([]));
        }
    }
};

/*const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: 'AKIA5GLSIIS4NFKWWLGC',
    secretAccessKey: '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'
});

const uploadFile = async (req, res) => {
    console.log(req.file);
    fs.readFile(fileName, (err, data) => {
        if (err) throw err;
        const params = {
            Bucket: 'cyndi.primary.bucket', // pass your bucket name
            Key: 'backend/'+fileName, // file will be saved as testBucket/contacts.csv
            Body: JSON.stringify(data, null, 2)
        };
        s3.upload(params, function(s3Err, data) {
            if (s3Err) throw s3Err
            console.log(`File uploaded successfully at ${data.Location}`)
        });
    });
};*/

const getFirebaseAuthToken = async (req, res) => {

    let uid = req.sanitize(req.headers['user_id']);
    /*const roleDetails = {
        roleType: 'Teacher',
    };*/
    const firebaseAdmin = req.app.get('firebaseAdmin');
    firebaseAdmin
        .auth()
        .createCustomToken(uid, /*additionalClaims*/)
        .then((customToken) => {
            res.status(200).end(JSON.stringify(customToken));
        })
        .catch((error) => {
            console.log('Error creating custom token:', error);
        });
};

/**
 * This function is used to add the contents in the diary to the database
 * Parameters are
 * param user_id - This is the user id of the creator of the class.
 * param diary_body - This is the content of the diary.
 * param diary_date - This is the date on which diary was created.
 */
const saveDiary = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const diary_body = req.sanitize(req.body.diary_body);
    const diary_date = req.sanitize(req.body.diary_date);
    if (diary_body && diary_date && user_id) {
        const response = await db.getDiaryById({user_id, diary_date});
        if (response.length > 0) {
            const updateDiary = await db.updateDiary({user_id, diary_body, diary_date});
            res.status(200).end("Diary updated");
        } else {
            const addDiary = await db.addDiary({user_id, diary_body, diary_date});
            res.status(200).end("Diary added");
        }
    } else {
        res.status(201).end(common.try_again);
    }

};

/**
 * This function is used to get the contents of the diary from database.
 * Param user_id is the user_id of the creator.
 * Param diary_date is the date on which the diary was created.
 */
const getDiary = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const diary_date = req.sanitize(req.body.diary_date);

    if (user_id && diary_date) {
        const response = await db.getDiaryById({user_id, diary_date});

        if (response.length > 0) {
            res.status(200).end(response[0]['diary_body'])
        } else {
            res.status(201).end("No Diary Found");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const peopleSearch = async (req, res) => {
    const db = req.app.get('db');
    const keyword = req.sanitize(req.body.keyword);
    const in_offset = req.sanitize(req.body.offset);
    const in_limit = req.sanitize(req.body.limit);

    const response = await db.searchUser({keyword, in_limit, in_offset});
    let out_data = [];

    let finalResponse = new Promise(async (resolve, reject) => {

        for (let i = 0; i < response.length + 1; ++i) {
            if (i === response.length) {
                resolve(out_data);
                break;
            }
            if (response[i].role === common.roleTeacher) {
                const tUserId = response[i].id;
                let tData = await db.getSearchTeacher({tUserId});
                if (!isEmpty(tData)) {
                    out_data.push(tData[0]);
                }

            } else if (response[i].role === common.roleStudent) {
                const sUserId = response[i].id;
                let sData = await db.getSearchStudent({sUserId});
                if (!isEmpty(sData)) {
                    out_data.push(sData[0]);
                }
            }
        }

    }).then(out => {
        res.status(200).end(JSON.stringify(out));
    })

};

async function peopleSearchIn(data, db) {

    const keyword = data.keyword;
    const in_offset = data.offset;
    const in_limit = data.limit;
    const response = await db.searchUser({keyword, in_limit, in_offset});
    let out_data = [];

    return new Promise(async (resolve, reject) => {

        for (let i = 0; i < response.length + 1; ++i) {

            if (i === response.length) {
                resolve(out_data);
                break;
            }
            if (response[i].role === "Teacher") {
                const tUserId = response[i].id;
                let tData = await db.getSearchTeacher({tUserId});
                if (!isEmpty(tData)) {
                    out_data.push(tData[0]);
                }

            } else if (response[i].role === "Student") {
                const sUserId = response[i].id;
                let sData = await db.getSearchStudent({sUserId});
                if (!isEmpty(sData)) {
                    out_data.push(sData[0]);
                }
            }
        }

    });


}

const resourceSearch = async (req, res) => {
    const db = req.app.get('db');
    const keyword = req.sanitize(req.body.keyword);
    const class_id = req.sanitize(req.body.class_id);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    if (keyword && class_id && limit) {
        const response = await db.getSearchResources({keyword, limit, offset, class_id});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end("Invalid details please try again");
        }
    } else {
        res.status(201).end(common.try_again);
    }


};

async function resourceSearchIn(data, db) {

    const keyword = data.keyword;
    const class_id = data.class_id;
    const limit = data.limit;
    const offset = data.offset;
    if (keyword && class_id && limit) {
        const response = await db.getSearchResources({keyword, limit, offset, class_id});
        if (response.length > 0) {
            return response;
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}

const pnaSearch = async (req, res) => {
    const db = req.app.get('db');
    const keyword = req.sanitize(req.body.keyword);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);
    const response = await db.getSearchPNA({keyword, limit, offset});
};

const qesSearch = async (req, res) => {
    const db = req.app.get('db');
    const keyword = req.sanitize(req.body.keyword);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);
    const response = await db.getSearchQES({keyword, limit, offset});
};

const saveNews = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const title = req.sanitize(req.body.title);
    const body = req.sanitize(req.body.body);
    const data_url = req.sanitize(req.body.data_url);
    const data_type = req.sanitize(req.body.data_type);
    const datetime = req.sanitize(req.body.datetime);
    const college = req.sanitize(req.body.college);
    const reference_url = req.sanitize(req.body.reference_url);
    if (user_id && title && body && datetime && data_type && data_url) {
        const response = await db.addNews({
            user_id,
            title,
            body,
            data_url,
            data_type,
            datetime,
            college,
            reference_url
        });
        if (!response.empty) {
            res.status(200).end("News added");
        } else {
            res.status(201).end("News not added");
        }

    } else {
        res.status(201).end(common.try_again);
    }


};

const getNews = async (req, res) => {
    const db = req.app.get('db');
    const college = req.sanitize(req.body.college);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    const response = await db.getNews({limit, offset, college});
    if (response.length > 0) {
        res.status(200).end(JSON.stringify(response));
    } else {
        res.status(201).end("Error");
    }

};

const search = async (req, res) => {
    const db = req.app.get('db');
    const data = req.sanitize(req.body);
    const finalResponse = {};
    const response = await peopleSearchIn(data, db).then(async out => {
        const resource = await resourceSearchIn(data, db);
        finalResponse.push(out);
        finalResponse.push(resource);

    })
};

const getEducationNotifications = async (req, res) => {
    const db = req.app.get('db');
    const university_name = req.sanitize(req.body.university_name);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);
    if (university_name && limit) {
        const response = await db.getEducationalNotification({
            university_name,
            limit,
            offset
        });
        if (response.length > 0) {
            if (response.length === 0) {
                res.status(201).end("No Educational Notifications");
            } else {
                res.status(200).end(JSON.stringify(response));
            }
        } else {
            res.status(201).end("No Educational Notifications");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const addEducationNotifications = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers['user_id']);
    let {title, body, datetime, university_name, college_name, department_name, class_id, type, link} = req.body;
    if (university_name && datetime && title && body && type) {
        const response = await db.addEducationalNotification({
            user_id, title, body, datetime,
            university_name, college_name, department_name, class_id, type, link
        });
        if (!response.empty) {
            res.status(200).send('Notification added');
            console.log(class_id);
            console.log(user_id);
            let classResponse = await db.getClassById({class_id});
            if (classResponse.length > 0) {
                let message = {
                    teacher_id: "" + user_id,
                    class_id: "" + class_id,
                    class_name: "" + classResponse[0].class_name,
                    teacher_name: "" + classResponse[0].name,
                    type: "ClassNotification",
                    photo_url: "" + classResponse[0].photo_url,
                    description: "" + title
                };
                await fetchClassTokens(message, req.app.get('firebaseAdmin'), db);
            }
        } else {
            res.status(201).end("Not Added");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const addGroup = async (req, res) => {
    const db = req.app.get('db');
    const admin = req.app.get('firebaseAdmin');
    let user_id = req.sanitize(req.headers['user_id']);

    const group_name = req.sanitize(req.body.group_name);
    const group_icon = req.sanitize(req.body.group_icon);
    const group_description = req.sanitize(req.body.group_description);
    const group_participants = parseJson(req.body.group_participants);

    if (user_id && group_name && group_icon && group_description && group_participants) {
        const response = await db.addGroup({
            user_id,
            group_name,
            group_icon,
            group_description,
            group_participants,
        });

        if (!response.empty) {

            res.status(200).send('Group Added Successfully');
            let message = {
                user_id: "" + user_id,
                group_name: "" + group_name,
                group_icon: "" + group_icon,
                type: "Group",
                group_id: response[0]['group_id']
            };


            await fetchGroupTokens(message, admin, db);
        } else {
            res.status(401).end('Adding Group failed, Try again');
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const getGroups = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.sanitize(req.headers['user_id']);
    let json = '[{"user_id": "' + user_id + '"}]';
    let response = await db.getGroups({json});
    res.status(200).end(JSON.stringify(response));
};

const addLiveClasses = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers['user_id']);
    const meeting_no = req.sanitize(req.body.meeting_no);
    const end_time = req.sanitize(req.body.end_time);
    const status = req.sanitize(req.body.status);
    const class_id = req.sanitize(req.body.class_id);
    const start_time = req.sanitize(req.body.start_time);
    if (class_id && start_time && user_id) {
        let response = await db.addTempLiveClass({user_id, class_id, meeting_no, start_time, end_time, status});
        if (response.length > 0) {
            console.log(response);
            console.log(req.body);
            res.status(200).send(JSON.stringify(response));
            let classResponse = await db.getClassById({class_id});
            if (!classResponse.empty && classResponse.length > 0) {
                let message = {
                    teacher_id: "" + user_id,
                    class_id: "" + class_id,
                    class_name: "" + classResponse[0].class_name,
                    teacher_name: "" + classResponse[0].name,
                    type: "LiveClass",
                    photo_url: "" + classResponse[0].photo_url,
                    description: "Live Class has been started.",
                    meeting_no: "" + meeting_no
                };
                await fetchClassTokens(message, req.app.get('firebaseAdmin'), db);
            }
        } else {
            res.status(200).end(common.try_again);
        }
    } else {
        res.status(200).end(common.try_again);
    }
};

function test() {
    let string = '';
    let class_id = [23, 34, 45, 56];
    for (let i = 0; i < class_id.length; i++) {
        string += 'l.class_id = ' + class_id[i];
        if (i !== class_id.length - 1) {
            string += ' or ';
        }
    }
    let query = 'select c.class_name, ' +
        'c.course, ' +
        'c.year, ' +
        'c.semester, ' +
        'l.class_id, ' +
        'l.start_time, ' +
        'l.end_time, ' +
        'l.status, ' +
        'l.user_id, ' +
        'l.meeting_no ' +
        'from public.table_live_class_temp l, ' +
        'public.class_table c ' +
        'where (' + string + ') ' +
        'and l.class_id = c.class_id ' +
        'order by l.live_class_id desc ' +
        'limit ' + limit + ' offset ' + offset + ';';
}

const getLiveClassesForStudent = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers['user_id']);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    if (user_id) {
        let response = await db.getLiveClassForStudent({user_id, limit, offset});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(200).end(JSON.stringify([]));
        }
    } else {
        res.status(200).end(common.try_again);
    }
};

const getLiveClassesForTeacher = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers['user_id']);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    if (user_id) {
        let response = await db.getTempLiveClassForTeacher({user_id, limit, offset});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(200).end(JSON.stringify([]));
        }
    } else {
        res.status(200).end(common.try_again);
    }
};

function sample() {
    let o = {
        format: "urls"
    };

    let bodyString = JSON.stringify(o);
    let https = require("https");
    let options = {
        host: "global.xirsys.net",
        path: "/_turn/sample",
        method: "PUT",
        headers: {
            "Authorization": "Basic " + Buffer.from("Fauzdar1:90fc398a-825d-11eb-9a8b-0242ac150002").toString("base64")
        }
    };
    let httpreq = https.request(options, function (httpres) {
        let str = "";
        httpres.on("data", function (data) {
            str += data;
        });
        httpres.on("error", function (e) {
            console.log("error: ", e);
        });
        httpres.on("end", function () {
            console.log("ICE List: ", str);
        });
    });
    httpreq.on("error", function (e) {
        console.log("request error: ", e);
    });
    httpreq.end();
}

const masterRole = async (req, res) => {
    /*let query = 'select * from master_role';
    console.log(query);
    //const devideId= req.deviceId;
    pool.query(query, (error, result) => {
        if (error) {
            console.log(error);
            res.status(200).end('Database Error');
        }
        if (result.rows.length > 0) {
            console.log(result.rows);
            res.status(200).end(JSON.stringify(result.rows));
        } else {
            res.status(200).end('No record found');
        }
    });*/
};


const getCourse = async (req, res) => {
    let query = 'select * from master_course';
    console.log(query);
    //const devideId= req.deviceId;
    pool.query(query, (error, result) => {
        if (error) {
            console.log(error);
            res.status(200).end('Database Error');
        }
        if (result.rows.length > 0) {
            console.log(result.rows);
            res.status(200).end(JSON.stringify(result.rows));
        } else {
            res.status(200).end('No record found');
        }
    });
};




const getUnivercity = async (req, res) => {
    let query = 'select * from master_university';
    console.log(query);
    //const devideId= req.deviceId;
    pool.query(query, (error, result) => {
        if (error) {
            console.log(error);
            res.status(200).end('Database Error');
        }
        if (result.rows.length > 0) {
            console.log(result.rows);
            res.status(200).end(JSON.stringify(result.rows));
        } else {
            res.status(200).end('No record found');
        }
    });
};


const getCollage = async (req, res) => {
    let query = 'select * from master_college';
    console.log(query);
    //const devideId= req.deviceId;
    pool.query(query, (error, result) => {
        if (error) {
            console.log(error);
            res.status(200).end('Database Error');
        }
        if (result.rows.length > 0) {
            console.log(result.rows);
            res.status(200).end(JSON.stringify(result.rows));
        } else {
            res.status(200).end('No record found');
        }
    });
};




const getSemester = async (req, res) => {
    let query = 'select * from master_semester';
    console.log(query);
    //const devideId= req.deviceId;
    pool.query(query, (error, result) => {
        if (error) {
            console.log(error);
            res.status(200).end('Database Error');
        }
        if (result.rows.length > 0) {
            console.log(result.rows);
            res.status(200).end(JSON.stringify(result.rows));
        } else {
            res.status(200).end('No record found');
        }
    });
};


const getSubject = async (req, res) => {
    let query = 'select * from master_subject';
    console.log(query);
    //const devideId= req.deviceId;
    pool.query(query, (error, result) => {
        if (error) {
            console.log(error);
            res.status(200).end('Database Error');
        }
        if (result.rows.length > 0) {
            console.log(result.rows);
            res.status(200).end(JSON.stringify(result.rows));
        } else {
            res.status(200).end('No record found');
        }
    });
};

    






module.exports = {
    getCompetitionDetails,
    getEntries,
    getRoleBasedUserDetails,
    getOtherUserProfile,
    getPosts,
    getMeetings,
    getAllUsers,
    getUserDrafts,
    getFirebaseAuthToken,
    saveCompetitionEntry,
    saveCompetitionPost,
    saveFCMTokens,
    saveNewHomePost,
    saveNewHomeDraft,
    saveMeetings,
    deleteDraft,
    updateDraft,
    saveDiary,
    getDiary,
    peopleSearch,
    saveNews,
    getNews,
    resourceSearch,
    search,
    getEducationNotifications,
    addEducationNotifications,
    addGroup,
    getGroups,
    getLiveClassesForStudent,
    getLiveClassesForTeacher,
    addLiveClasses,
    masterRole,
    sendMailOTP,
    getCourse,
    getUnivercity,
    getCollage,
    getSemester,
    getSubject
};

