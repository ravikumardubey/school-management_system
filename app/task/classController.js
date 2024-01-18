const pool = require('../lib/database').connection;
const common = require('../lib/database');
const parseJson = require('parse-json');
require('body-parser');
const getClassCode = require('./getClassCode');
const notificationController = require('./notificationController');

/**
 * This function returns all the students from the database to the user.
 * This is used to list all the students of a particular course of a college so that teacher can add them into a class.
 * param college_name - This is the college name of the teacher to match with college name of the students.
 * param session - This is the course session of the students requested. ex - 2018-2020
 * param course - This is the course of the students requested.
 */
const getStudents = async (req, res) => {
    const db = req.app.get('db');
    const college_name = req.sanitize(req.body.college_name);
    const semester = req.sanitize(req.body.semester);
    const course = req.sanitize(req.body.course);
    let response = await db.getStudents({college_name, course, semester});
    if (response.length > 0) {
        for (let i = 0; i < response.length; i++) {
            delete response[i]['encrypted_password'];
            delete response[i]['salt'];
            delete response[i]['created_at'];
            delete response[i]['updated_at'];
        }
        res.status(200).end(JSON.stringify(response));
    } else {
        res.status(201).end('Adding meeting failed');
    }
};

const getTeacherListForAddClass = async (req, res) => {
    const db = req.app.get('db');
    const university_name = req.sanitize(req.body.university_name);
    const college = req.sanitize(req.body.college);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    if (university_name && college && limit) {
        const response = await db.getTeacherListForClass({university_name, college, limit, offset});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end("error try again");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const getStudentListForAddClass = async (req, res) => {
    const db = req.app.get('db');
    const university_name = req.sanitize(req.body.university_name);
    const college = req.sanitize(req.body.college);
    const course = req.sanitize(req.body.course);
    const year = req.sanitize(req.body.year);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    if (university_name && college && limit && year && course) {
        const response = await db.getStudentListForClass({university_name, college, limit, offset, year, course});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end("error try again");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

/**
 * This function is used to add a class on the app.
 * param user_id - This is the user id of the creator of the class.
 * param college_name - This is the college in which the class is created.
 * param course - This is the course of the class.
 * param year - This is the year for which the class is created.
 * param class_session - This is the class session like 2018-2020.
 * param semester - This is the semester of the class.
 * param section - This is the section of the class (Optional).
 * param class_name - This is the class name/title.
 * param class_description - This is the class description describing about the class.
 * param class_strength - This is the total strength of the class.
 * param students_list - This is the user id list of all the students of the class.
 * param teachers_list - This is the user id of the teachers of the class.
 */
const addClass = (req, res) => {
    const admin = req.app.get('firebaseAdmin');
    const db = req.app.get('db');
    const user_id = req.headers['user_id'];
    const university_name = req.sanitize(req.body.university_name);
    const college_name = req.sanitize(req.body.college_name);
    const course = req.sanitize(req.body.course);
    const year = req.sanitize(req.body.year);
    const semester = req.sanitize(req.body.semester);
    const batch = req.sanitize(req.body.batch);
    const class_name = req.sanitize(req.body.class_name);
    const class_description = req.sanitize(req.body.class_description);
    const class_strength = req.sanitize(req.body.class_strength);
    const teachers_list = req.sanitize(req.body.teachers_list);
    const students_list = req.sanitize(req.body.students_list);
    const section = req.sanitize(req.body.section);

    if (user_id &&
        university_name &&
        college_name &&
        course && year &&
        batch && class_name &&
        class_description &&
        class_strength &&
        students_list &&
        teachers_list) {

        getClassCode.getClassCode(async (code) => {
            if (code) {
                console.log(code);
                const response = await db.addClass({
                    user_id,
                    university_name,
                    college_name,
                    course, year,
                    semester,
                    batch,
                    class_name,
                    class_description,
                    class_strength,
                    teachers_list,
                    students_list,
                    section,
                    code
                });
                if (response.length > 0) {
                    res.status(200).send('Class Added Successfully');

                    //Obtaining newly added class's class_id from the response
                    let class_id = response[0].class_id;

                    //Obtaining className by removing whitespaces from the name passed from the frontend
                    let className = class_name.replace(/\s+/g, '');

                    let tokenList = [];
                    let usersIdList = [];

                    //Adding all teachers and students passed from the frontend into a same list
                    let peopleList = [...parseJson(teachers_list)['users']];
                    peopleList.push(...parseJson(students_list)['users']);

                    //Extracting each teacher's and student's userId and putting it into an array
                    for (let i = 0; i < peopleList.length; i++) {
                        const onePersonID = parseJson(peopleList[i])['user_id'];
                        usersIdList.push(onePersonID)
                    }

                    //Querying the database for each user's fcm_token and putting it into an array
                    for (let i = 0; i < usersIdList.length; i++) {
                        const id = usersIdList[i];
                        const tokenResponse = await db.getFCMTokens({id});
                        const oneToken = tokenResponse[0]['fcm_token'];
                        if (oneToken.length > 50) {
                            tokenList.push(oneToken);
                        }
                    }

                    //Creating a message payload object to be sent with notification
                    let message = {
                        teacher_id: "" + user_id,
                        class_id: "" + class_id,
                        class_name: "" + class_name,
                        teacher_name: "" + parseJson(peopleList[0]).name,
                        type: "AddClass",
                        photo_url: "" + parseJson(peopleList[0]).photo_url,
                        description: "" + class_description
                    };

                    //Adding the class in each user's class list, updating if exists
                    for (let i in usersIdList) {
                        let query = await db.insertOrUpdateUserClasses({
                            user_id: usersIdList[i],
                            class_id: '[{"id": ' + class_id + '}]',
                            ip: req.ip,
                            status: 1
                        });
                    }

                    //Subscribing the topic with updated token list and then sending the notification
                    notificationController.subscribeToTopic(tokenList, className, admin).then(value => {
                            notificationController.notifyTopic(className, message, admin);
                        }
                    );
                } else {
                    res.status(401).end('Adding Class failed, Try again');
                }
            } else {
                res.status(201).end('Database Error');
            }
        });

    } else {
        res.status(201).end(common.try_again);
    }
};

/**
 * This function returns all the classes of a teacher.
 *
 */
/*const getClassForTeacher = async (req, res) => {
    const db = req.app.get('db');
    const university_name = req.sanitize(req.body.university_name);
    const college_name = req.sanitize(req.body.college_name);
    let user_id = req.headers['user_id'];

    if (college_name && user_id) {
        const response = await db.getClassForTeacher({
            university_name,
            college_name
        });
        if (response.length > 0) {
            let i, j;
            let class_list = [];
            for (i = 0; i < response.length; i++) {
                let teacher_list = response[i]['teachers_list'];
                teacher_list = parseJson(teacher_list)['users'];
                for (j = 0; j < teacher_list.length; j++) {
                    const oneTeacher = parseJson(teacher_list[j]);
                    if (oneTeacher.user_id === user_id) {
                        class_list.push(response[i]);
                    }
                }
            }
            if (class_list.length === 0) {
                res.status(201).end('No classes found for user1');
            } else {
                res.status(200).end(JSON.stringify(class_list));
            }
        } else {
            res.status(201).end('No classes found for user2');
        }
    } else {
        res.status(401).end(common.try_again);
    }
};*/

/**
 * This function returns all the classes of a student.
 *
 */
const getClasses = async (req, res) => {
    const db = req.app.get('db');
    let user_id = req.headers['user_id'];

    if (user_id) {
        const response = await db.getClasses({
            user_id
        });
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end('No classes found for user');
        }
    } else {
        res.status(401).end(common.try_again);
    }
};

/**
 * This function is used to upload/save resources on the database
 * Param user_id is the user id of the creator
 * Param assigned_to is the json array of class ids to which the resource is assigned.
 * Param datetime is the
 * Param attached_files is the link of the attached files user adds
 * Param title is the title of the resource
 * Param description is the description of the resource
 * Param university_name is the name of the university
 * Param college_name of the college/department
 * Param resource_id is the unique id of the resource
 *
 */
const addResource = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const assigned_to = req.sanitize(req.body.assigned_to);
    const datetime = req.sanitize(req.body.datetime);
    const attached_files = req.sanitize(req.body.attached_files);
    const title = req.sanitize(req.body.title);
    const description = req.sanitize(req.body.description);
    const university_name = req.sanitize(req.body.university_name);
    const college_name = req.sanitize(req.body.college_name);
    const resource_id = req.sanitize(req.body.resource_id);
    const type = req.sanitize(req.body.type);

    if (resource_id && attached_files && datetime && assigned_to) {
        const response = await db.updateResource({
            resource_id,
            assigned_to,
            datetime,
            attached_files
        });
        if (!response.empty) {
            res.status(200).end("Resource updated");
        } else {
            res.status(201).end("Resource not updated");
        }
    } else if (user_id && title && description && assigned_to && datetime && title && description && university_name && college_name && attached_files) {
        const response = await db.addResource({
            user_id,
            title,
            description,
            assigned_to,
            datetime,
            university_name,
            college_name,
            attached_files,
            type
        });
        if (!response.empty) {
            res.status(200).end("Resource added");
        } else {
            res.status(201).end("Resource not added");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const getResourceForTeacher = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const university_name = req.sanitize(req.body.university_name);
    const college_name = req.sanitize(req.body.college_name);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    if (user_id && limit && university_name && college_name) {
        const response = await db.getResourceForTeacher({user_id, limit, offset, university_name, college_name});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end("Can't get resource");
        }
    } else {
        res.status(201).end(common.try_again);
    }

};

const getResourceForClass = async (req, res) => {
    const db = req.app.get('db');
    //const user_id = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);
    const university_name = req.sanitize(req.body.university_name);
    const college_name = req.sanitize(req.body.college_name);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);

    if (class_id && limit && university_name && college_name) {
        const response = await db.getResourceForClass({class_id, limit, offset, university_name, college_name});
        let finalRes = [];
        if (response.length > 0) {
            for (let i = 0; i < response.length; i++) {
                let assignedTo = response[i].assigned_to;
                let classes_list = parseJson(assignedTo)["assigned_to"];
                for (let j = 0; j < classes_list.length; j++) {
                    if (classes_list[j].class_id === class_id) {
                        finalRes.push(response[i]);
                    }
                }
            }
            res.status(200).end(JSON.stringify(finalRes));
        } else {
            res.status(201).end("Can't get resource");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const addSyllabus = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);
    const title = req.sanitize(req.body.title);
    const description = req.sanitize(req.body.description);
    const attached_files = req.sanitize(req.body.attached_files);
    const attached_url = req.sanitize(req.body.attached_url);
    const dateTime = req.sanitize(req.body.dateTime);
    if (user_id && class_id && title && description && dateTime) {
        const response = await db.addSyllabus({
            user_id,
            class_id,
            title,
            description,
            attached_files,
            dateTime,
            attached_url
        });
        if (!response.empty) {
            res.status(200).end("Syllabus added");
        } else {
            res.status(201).end('Something went wrong');
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const getSyllabus = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);

    if (user_id && class_id) {
        const response = await db.getSyllabus({class_id});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end('Something went wrong');
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const addChapterPlan = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);
    const title = req.sanitize(req.body.title);
    const description = req.sanitize(req.body.description);
    const attached_files = req.sanitize(req.body.attached_files);
    const attached_url = req.sanitize(req.body.attached_url);
    const dateTime = req.sanitize(req.body.dateTime);
    if (user_id && class_id && title && description && dateTime) {
        const response = await db.addChapterPlan({
            user_id,
            class_id,
            title,
            description,
            attached_files,
            dateTime,
            attached_url
        });
        if (!response.empty) {
            res.status(200).end("Chapter Plan added");
        } else {
            res.status(200).end('Something went wrong');
        }
    } else {
        res.status(200).end(common.try_again);
    }
};

const getChapterPlan = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);

    if (user_id && class_id) {
        const response = await db.getChapterPlan({class_id});
        if (response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end('Something went wrong');
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const addActivity = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const activity_id = req.sanitize(req.body.activity_id);
    const class_id = req.sanitize(req.body.class_id);
    const activity_type = req.sanitize(req.body.activity_type);
    const question_type = req.sanitize(req.body.question_type);
    const form_type = req.sanitize(req.body.form_type);
    const title = req.sanitize(req.body.title);
    const description = req.sanitize(req.body.description);
    const total_questions = req.sanitize(req.body.total_questions);
    const marks_detail = req.sanitize(req.body.marks_detail);
    const time_detail = req.sanitize(req.body.time_detail);
    const public_visibility = req.sanitize(req.body.public_visibility);
    const visible_before_time = req.sanitize(req.body.visible_before_time);
    const submit_after_time = req.sanitize(req.body.submit_after_time);
    const questions = req.sanitize(req.body.questions);
    const attached_files = req.sanitize(req.body.attached_files);
    const datetime = req.sanitize(req.body.datetime);

    if (activity_id) {
        const response = await db.updateActivity({
            activity_id,
            activity_type,
            question_type,
            form_type,
            title,
            description,
            total_questions,
            marks_detail,
            time_detail,
            public_visibility,
            visible_before_time,
            submit_after_time,
            questions,
            attached_files
        });
        if (!response.empty) {
            res.status(200).end("Activity updated");
        } else {
            res.status(201).end("Activity not updated");
        }
    } else if (user_id &&
        class_id &&
        activity_type &&
        question_type &&
        form_type &&
        title &&
        description &&
        total_questions &&
        marks_detail &&
        time_detail &&
        public_visibility &&
        visible_before_time &&
        submit_after_time &&
        datetime) {
        const response = await db.addActivity({
            user_id,
            class_id,
            activity_type,
            question_type,
            form_type,
            title,
            description,
            total_questions,
            marks_detail,
            time_detail,
            public_visibility,
            visible_before_time,
            submit_after_time,
            questions,
            attached_files,
            datetime
        });
        if (!response.empty) {
            res.status(200).end("Activity Added");
        } else {
            res.status(201).end("Not added");
        }
    } else {
        res.status(201).end(common.try_again);
    }

};

const getQES = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);
    const role = parseInt(req.sanitize(req.body.role));

    if (class_id && limit.toString()) {
        let response = await db.getQES({
            class_id,
            limit,
            offset
        });
        if (!response.empty && response.length > 0) {
            for (let i = 0; i < response.length; i++) {
                const activity_id = response[i].activity_id;
                if (role === common.roleStudent) {
                    let studentResponse = await db.getSubmissionStatusForData({activity_id, class_id, user_id});
                    response[i].status = !studentResponse.empty && studentResponse.length > 0 ? 1 : 0;
                } else if (role === common.roleTeacher) {
                    let teacherResponse = await db.getSubmissionCount({activity_id, class_id});
                    response[i].status = !teacherResponse.empty && teacherResponse.length > 0 ? teacherResponse[0].count : 0;
                } else {
                    res.status(200).end("Invalid role");
                }
            }
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end("Can't get QES");
        }
    } else {
        res.status(201).end(common.try_again + limit + offset + class_id);
    }
};

const getPANDA = async (req, res) => {
    const db = req.app.get('db');
    const class_id = req.sanitize(req.body.class_id);
    const limit = req.sanitize(req.body.limit);
    const offset = req.sanitize(req.body.offset);
    const user_id = req.sanitize(req.headers.user_id);
    const role = parseInt(req.sanitize(req.body.role));

    if (class_id && limit) {
        const response = await db.getPANDA({
            class_id,
            limit,
            offset
        });
        if (response.length > 0) {
            for (let i = 0; i < response.length; i++) {
                const activity_id = response[i].activity_id;
                if (role === common.roleStudent) {
                    let studentResponse = await db.getSubmissionStatusForData({activity_id, class_id, user_id});
                    response[i].status = !studentResponse.empty && studentResponse.length > 0 ? 1 : 0;
                } else if (role === common.roleTeacher) {
                    let teacherResponse = await db.getSubmissionCount({activity_id, class_id});
                    response[i].status = !teacherResponse.empty && teacherResponse.length > 0 ? teacherResponse[0].count : 0;
                } else {
                    res.status(200).end("Invalid role");
                }
            }
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(201).end("Can't get PANDA");
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const submitActivityAnswer = async (req, res) => {
    const db = req.app.get('db');
    const userId = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);
    const activity_id = req.sanitize(req.body.activity_id);
    const answers = req.sanitize(req.body.answers);
    const datetime = req.sanitize(req.body.datetime);
    const activityType = req.sanitize(req.body.activity_type);
    const title = req.sanitize(req.body.title);
    const name = req.sanitize(req.body.name);
    const photo_url = req.sanitize(req.body.photo_url);
    const receiverId = req.sanitize(req.body.receiver_id);

    if (class_id && activity_id && answers && datetime && receiverId) {
        let response = await db.submitActivityAnswer({userId, class_id, activity_id, answers, datetime});
        if (!response.empty) {
            res.status(200).send("Submission successful");
            let payload = {
                data: {
                    senderId: "" + userId,
                    type: "Activity",
                    name: "" + name,
                    activityId: "" + activity_id,
                    photoUrl: "" + photo_url,
                    activityName: "" + activityType,
                    classId: "" + class_id,
                    title: "" + title
                }
            };

            const firebaseAdmin = req.app.get('firebaseAdmin');
            await notificationController.notifyUser(db, receiverId, firebaseAdmin, payload, (message) => {
                console.log(message);
            });
        } else {
            res.status(201).end("Submission failed");
        }
    } else {
        res.status(200).end(common.try_again);
    }
};

const getSubmission = async (req, res) => {
    const user_id = req.sanitize(req.body.user_id);
    const class_id = req.sanitize(req.body.class_id);
    const activity_id = req.sanitize(req.body.activity_id);
    const db = req.app.get('db');

    if (class_id && activity_id) {
        let response = await db.getSubmission({class_id, activity_id});
        if (!response.empty && response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(200).end('No data found');
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

/**
 * This function returns the Class found for the class code passed from the frontend.
 * param code - Code of the class requested.
 */
const getClassForCode = async (req, res) => {

    const db = req.app.get('db');
    const code = req.sanitize(req.body.code);
    const user_id = req.sanitize(req.headers.user_id);

    if (code && user_id) {
        let response = await db.getClassForCode({code});
        if (response && response.length > 0) {
            res.status(200).end(JSON.stringify(response));
        } else {
            res.status(200).end('No Such Class');
        }
    } else {
        res.status(201).end(common.try_again);
    }
};

const addStudentInClass = async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.sanitize(req.headers.user_id);
    const class_id = req.sanitize(req.body.class_id);
    const name = req.sanitize(req.body.name);
    const photo_url = req.sanitize(req.body.photo_url);

    if (user_id) {
        let query = 'select students_list from public.class_table where class_id = $1;';
        let values = [class_id];

        pool.query(query, values, (error, results) => {
            if (error) {
                console.log('DB Error' + error);
                res.status(201).end('Database Error');
            }
            if (results.rows.length > 0) {
                let students_list = JSON.parse(results.rows[0].students_list);
                let isUserAlreadyAdded = false;
                let users = students_list.users;

                for (let i = 0; i < users.length; i++) {
                    isUserAlreadyAdded = JSON.parse(users[i]).user_id === user_id;
                }

                if (isUserAlreadyAdded) {
                    res.status(200).end("Class already Joined!");
                } else {
                    users.push(JSON.stringify({
                        "isChecked": true,
                        "name": name,
                        "photo_url": photo_url,
                        "user_id": user_id,
                        "status": 0
                    }));

                    students_list.users = users;

                    let query1 = 'update public.class_table set students_list=$2 where class_id=$1;';
                    let values = [class_id, students_list];

                    pool.query(query1, values, (error1, result) => {
                        if (error1) {
                            console.log('DB Error' + error1);
                            res.status(201).end('Database Error');
                        }
                        res.status(200).end("Joined successfully");
                    });
                }


            } else {
                res.status(200).end('No such Class');
            }
        })
    } else {
        res.status(201).end(common.try_again);
    }
};

module.exports = {
    getStudents,
    getTeacherListForAddClass,
    getStudentListForAddClass,
    addClass,
    // getClassForTeacher,
    getClasses,
    addResource,
    getResourceForTeacher,
    getResourceForClass,
    addSyllabus,
    getSyllabus,
    addChapterPlan,
    getChapterPlan,
    addActivity,
    getQES,
    getPANDA,
    submitActivityAnswer,
    getSubmission,
    getClassForCode,
    addStudentInClass
};