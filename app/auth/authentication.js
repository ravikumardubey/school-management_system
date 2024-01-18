const crypto = require('crypto');
const uuid = require('uuid');
/*const rp = require('request-promise');*/
const common = require('../lib/database');
const jwt = require('jsonwebtoken');
const pool = require('../lib/database').connection;
const sendMail = require('../task/taskController').sendMail;


const getRandomString = function (length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};
const sha512 = function (password, salt) {
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

function saltHashPassword(userPassword) {
    const salt = getRandomString(16);
    return sha512(userPassword, salt);
}

//to Check if the passwords match by encrypting the received password and matching it with saved encrypted password
function checkPassword(password, salt) {
    return sha512(password, salt)
}

async function getFirebaseAuthToken(firebaseAdmin, uid) {
    let token = 'empty token';
    await firebaseAdmin
        .auth()
        .createCustomToken(uid, /*additionalClaims*/)
        .then((customToken) => {
            token = customToken;
        })
        .catch((error) => {
            console.log('Error creating custom token:', error);
            token = 'invalid token';
        });
    return token;
}

async function saveStudentData(userId, key, value, callback) {
    if (key === 'photo_url' || key === 'name' || key === 'gender' || key === 'dob') {
        let query = 'BEGIN; ' +
            'UPDATE public.profile_user ' +
            'SET ' + key + ' = \'' + value + '\',' +
            ' updated_at = Now() ' +
            'where profile_user.id = ' + userId + '; ' +
            'COMMIT;';

        pool.query(query, (error, result) => {
            if (error) {
                console.log(error);
                callback('Database Error');
            } else {
                callback('Data Saved');
            }
        });
    } else {

        let query = 'BEGIN; ' +
            'INSERT INTO public.profile_student(user_id, ' + key + ', created_at, updated_at) ' +
            'VALUES (' + userId + ', \'' + value + '\', NOW(), NOW()) ' +
            'on conflict (user_id) ' +
            'do update SET ' + key + ' = \'' + value + '\',' +
            ' updated_at = Now() ' +
            'where profile_student.user_id = ' + userId + '; ' +
            'COMMIT;';

        pool.query(query, (error, result) => {
            if (error) {
                console.log(error);
                callback('Database Error');
            } else {
                callback('Data Saved');
            }
        });
    }

}

async function saveTeacherData(userId, key, value, callback) {

    if (key === 'photo_url' || key === 'name' || key === 'gender' || key === 'dob') {
        let query = 'BEGIN; ' +
            'UPDATE public.profile_user ' +
            'SET ' + key + ' = \'' + value + '\',' +
            ' updated_at = Now() ' +
            'where profile_user.id = ' + userId + '; ' +
            'COMMIT;';


        pool.query(query, (error, result) => {
            if (error) {
                console.log(error);
                callback('Database Error');
            } else {
                callback('Data Saved');
            }
        });
    } else {


        let query = 'BEGIN; ' +
            'INSERT INTO public.profile_teacher(user_id, ' + key + ', created_at, updated_at) ' +
            'VALUES (' + userId + ', \'' + value + '\', NOW(), NOW()) ' +
            'on conflict (user_id) ' +
            'do update SET ' + key + ' = \'' + value + '\',' +
            ' updated_at = Now() ' +
            'where profile_teacher.user_id = ' + userId + '; ' +
            'COMMIT;';

        pool.query(query, (error, result) => {
            if (error) {
                console.log(error);
                callback('Database Error');
            } else {
                callback('Data Saved');
            }
        });
    }

}

function generatePassword() {
    return generator.generate({
        length: 8,
        uppercase: true,
        lowercase: true,
        numbers: true,
        strict: true
    });
}

function getJWTToken(id) {
    return jwt.sign({id: id}, common.session_key, {
        expiresIn: 432000 // expires in 5 days (120 hours)
    });
}

module.exports = {
    verifyToken: (req, res, next) => {
        const token = req.headers['x-access-token'];
        if (!token) {
            return res.status(403).send({auth: false, message: 'No token provided.'});
        }
        jwt.verify(token, common.session_key, async function (err, decoded) {
            if (err) {
                return res.status(500).send({auth: false, message: 'Failed to authenticate token.'});
            }
            const id = decoded.id;
            const db = req.app.get('db');
            if (req.headers['user_id'] === id) {
                const user = await db.getUserById({id});
                if (!user.empty) {
                    next();
                } else {
                    console.log('Unauthorized User ip:' + req.ip);
                    res.status(401).send({auth: false, token: null, log: 'Unauthorized user'});
                }
            } else {
                console.log('Unauthorized User ip:' + req.ip);
                res.status(401).send({auth: false, token: null, log: 'Unauthorized user'});
            }
        });
    },

    //This function is to login the user after verifying the password and returns user data if verified.
    loginUser: async (req, res) => {
        const db = req.app.get('db');
        let email = req.sanitize(req.body.email);
        let password = req.sanitize(req.body.password);
        let role = parseInt(req.sanitize(req.body.role));
        if (email && password && role) {
            email.trim();
            password.trim();
        
            let user = await db.getUserByEmailOrPhone({email, phone_no: email});
            if (user.length > 0) {
                const saved_role = user[0].role;
                const encryptedPassword = user[0].encrypted_password;
                const salt = user[0].salt;
                const hashedPassword = checkPassword(password, salt).passwordHash;
                if (encryptedPassword !== hashedPassword) {
                    res.status(201).end('Invalid password');
                } else {
                    if (role !== saved_role) {
                        const text = 'You\'re not a ' + common.getRoleName(role);
                        res.status(201).end(text);
                    }else {
                        const token = getJWTToken(user[0].id);
                        delete user[0]['encrypted_password'];
                        delete user[0]['salt'];
                        delete user[0]['created_at'];
                        delete user[0]['updated_at'];
                        let json = user[0];
                        const firebaseAdmin = req.app.get('firebaseAdmin');
                        json['firebase_auth_token'] = await getFirebaseAuthToken(firebaseAdmin, user[0].id);
                        json['token'] = token;
                        json['auth'] = true;
                        res.status(200).end(JSON.stringify(json));
                    }
                }
            } else {
                res.status(201).end('User does not exist');
            }
        } else {
            res.status(201).end(common.try_again);
        }
    },

    //This function is to complete the first three phases of registration process with the role included
    registerAnyUser: async (req, res) => {
        const db = req.app.get('db');
        const uid = uuid.v4();
        // accessing the data in request body
        let name = req.sanitize(req.body.name);
        let email = req.sanitize(req.body.email);
        let phone_no = req.sanitize(req.body.phone_no);
        let role = parseInt(req.sanitize(req.body.role));
        let dob = req.sanitize(req.body.dob);
        let photo_url = req.sanitize(req.body.photo_url);
        let gender = req.sanitize(req.body.gender);
        let password = req.sanitize(req.body.password);
        if (name && email && dob && password && phone_no && role) {
            const user = await db.getUserByEmailOrPhone({email, phone_no});
            if (user.length > 0) {
                res.status(201).end('User already exists');
            } else {
                const hash_data = saltHashPassword(String(password));
                const encrypted_password = hash_data.passwordHash;
                const salt = hash_data.salt;
                let register = await db.createNewUser({
                    uid,
                    name,
                    email,
                    encrypted_password,
                    salt,
                    phone_no,
                    role,
                    gender,
                    photo_url,
                    dob
                });
                let new_user = await db.getUserByEmailId({email});
                if (new_user.length > 0) {
                    const token = getJWTToken(new_user[0].id);
                    delete new_user[0]['encrypted_password'];
                    delete new_user[0]['salt'];
                    delete new_user[0]['created_at'];
                    delete new_user[0]['updated_at'];
                    let json = new_user[0];
                    const firebaseAdmin = req.app.get('firebaseAdmin');
                    json['firebase_auth_token'] = await getFirebaseAuthToken(firebaseAdmin, new_user[0].id);
                    json['token'] = token;
                    json['auth'] = true;
                    res.status(200).end(JSON.stringify(json));
                } else {
                    res.status(201).end("Try_again");
                }
            }
        } else {
            res.status(201).end(common.try_again);
        }
    },

    //This function is to complete the final phase of registration process of Student
    registerStudent: async (req, res) => {
        const db = req.app.get('db');
        let user_id = req.headers['user_id'];
        let university_name = req.sanitize(req.body.university_name);
        let college_name = req.sanitize(req.body.college_name);
        let roll_no = req.sanitize(req.body.roll_no);
        let course_name = req.sanitize(req.body.course_name);
        let batch = req.sanitize(req.body.batch);
        let city = req.sanitize(req.body.city);
        let semester = req.sanitize(req.body.semester); 
        let year = req.sanitize(req.body.year);
        let name = req.sanitize(req.body.name);
        let dob = req.sanitize(req.body.dob);
        let photo_url = req.sanitize(req.body.photo_url);
        let gender = req.sanitize(req.body.gender);
        // accessing the data in request body
        if (university_name && college_name && roll_no && course_name && batch && semester && user_id) {
            let user_profile_response = await db.updateUserProfile({name, dob, gender, photo_url, user_id});
            if (user_profile_response) {
                let response = await db.insertOrUpdateStudentProfile({
                    user_id,
                    university_name,
                    college_name,
                    roll_no,
                    course_name,
                    batch,
                    city,
                    year,
                    semester
                });
                if (response) {
                    res.status(200).end('Task successfully completed');
                }
            }
        } else {
            res.status(201).end(common.try_again);
        }
    },

    //This function is to complete the final phase of registration process of Teacher
    registerTeacher: async (req, res) => {
        const db = req.app.get('db');
        const user_id = req.headers['user_id'];
        let university_name = req.sanitize(req.body.university_name);
        let college_name = req.sanitize(req.body.college_name);
        let employee_id = req.sanitize(req.body.employee_id);
        let teacher_rank = req.sanitize(req.body.teacher_rank);
        let subject_expertise = req.sanitize(req.body.subject_expertise);
        let name = req.sanitize(req.body.name);
        let dob = req.sanitize(req.body.dob);
        let photo_url = req.sanitize(req.body.photo_url);
        let gender = req.sanitize(req.body.gender);
        // accessing the data in request body
        if (university_name && college_name && employee_id && teacher_rank && subject_expertise && user_id) {
            let user_profile_response = await db.updateUserProfile({name, dob, gender, photo_url, user_id});
            if (user_profile_response) {
                let response = await db.insertOrUpdateTeacherProfile({
                    user_id, university_name, college_name, employee_id, teacher_rank, subject_expertise
                });
                if (response) {
                    res.status(200).end('Task successfully completed');
                }
            }
        } else {
            res.status(201).end(common.try_again)
        }
    },

    saveUserData: async (req, res) => {
        const userId = req.sanitize(req.headers.user_id);
        const role = parseInt(req.sanitize(req.body.role));
        const key = req.sanitize(req.body.key);
        const value = req.sanitize(req.body.value);
        if (key && value && userId && role) {
            if (role === common.roleStudent) {
                await saveStudentData(userId, key, value, (data) => {
                    res.status(200).end(data);
                });
            } else {
                await saveTeacherData(userId, key, value, (data) => {
                    res.status(200).end(data);
                });
            }
        } else {
            res.status(201).send(common.try_again);
        }
    },

    //Changing the user password
    changePassword: async (req, res) => {
        const db = req.app.get('db');
        let {email, password} = req.body;
        let hash_data;
        if (password) {
            hash_data = saltHashPassword(String(password));
        }
        const encrypted_password = hash_data.passwordHash;
        const salt = hash_data.salt;
        if (email && encrypted_password && salt) {
            let userResponse = await db.getUserByEmailId({email});
            if (userResponse) {
                let response = await db.changePassword({encrypted_password, salt, email});
                if (response) {
                    res.status(200).end('Password successfully changed')
                }
            } else {
                res.status(201).end('User doesn\'t exist')
            }
        } else {
            res.status(201).json(common.try_again)
        }
    },

    logoutUser: async (req, res) => {
        res.status(200).send({auth: false, token: null});
    },

    checkUserForForgotPassword: async (req, res) => {
        let type = req.body.type;
        const db = req.app.get('db');

        if (type && type === 'Phone') {
            let phone_no = req.body.phone_no;
            if (phone_no && phone_no.length > 9) {
                phone_no = phone_no.replace(/\s+/g, '');
                let response = await db.checkPhoneNumberExistence({phone_no});
                const ifUserExist = !response.empty && response.length > 0;
                res.status(200).end(JSON.stringify({"ifUserExist": ifUserExist}));
            } else {
                res.status(200).end(common.try_again);
            }
        } else if (type && type === 'Email') {
            let email = req.body.email;
            if (email) {
                email = email.replace(/\s+/g, '');
                let response = await db.checkEmailExistence({email});
                const ifUserExist = !response.empty && response.length > 0;
                res.status(200).end(JSON.stringify({"ifUserExist": ifUserExist}));
            } else {
                res.status(200).end(common.try_again);
            }
        } else {
            res.status(200).end(common.try_again);
        }
    }
};