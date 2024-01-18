const common = require('../lib/database');
const parseJson = require('parse-json');
const http = require("https");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const pool = require('../lib/database').connection;

const getZoomMeetingRecording = async (req, res) => {
    const meeting_id = req.sanitize(req.body.meeting_id);
    const token = await getJWTToken();

    const options = {
        "method": "GET",
        "hostname": "api.zoom.us",
        "port": null,
        "path": "/v2/meetings/" + meeting_id + "/recordings",
        "headers": {
            "authorization": "Bearer " + token
        }
    };

    const request = http.request(options, function (result) {
        const chunks = [];

        result.on("data", function (chunk) {
            chunks.push(chunk);
        });

        result.on("end", function () {
            const body = Buffer.concat(chunks);
            console.log(body.toString());
            if (body.toString().includes('recording_files')) {
                let bodyJson = parseJson(body.toString());
                let recordingList = bodyJson.recording_files;
                if (!recordingList.empty && recordingList.length > 0) {
                    for (let i in recordingList) {
                        let item = recordingList[i];
                        if (item.file_type === 'MP4') {
                            item['download_url'] = "" + item['download_url'] + "?access_token=" + token;
                            item['play_url'] = "" + item['play_url'] + "?access_token=" + token;
                            bodyJson['recording'] = item;
                            delete bodyJson['recording_files'];
                        }
                    }
                }

                delete bodyJson['uuid'];
                delete bodyJson['account_id'];
                delete bodyJson['host_id'];
                delete bodyJson['host_email'];
                delete bodyJson['type'];
                delete bodyJson['recording_count'];
                delete bodyJson['total_size'];
                delete bodyJson['duration'];
                delete bodyJson['recording']['id'];
                delete bodyJson['recording']['meeting_id'];
                // bodyJson['token'] = token;
                res.status(200).send(JSON.stringify(bodyJson));
            } else {
                res.status(201).end(JSON.stringify({}));
            }
        });
    });
    request.end();
};

const initializeZoomMeeting = async (req, res) => {
    const user_id = req.headers['user_id'];
    const db = req.app.get('db');
    const jwt_token = await getJWTToken();

    await addZoomHost(user_id, db, jwt_token, async function (body, email) {
        await getZoomToken(email, jwt_token, async function (zoom_token) {
            await getZAKToken(email, jwt_token, async function (zak_token) {
                if (body === common.try_again) {
                    res.status(200).end(common.try_again);
                } else {
                    let ifUserExist = body.toString().includes('This user already exists');
                    if (ifUserExist || body.toString().includes('first_name')) {
                        await getZoomHost(email, jwt_token, async function (body) {
                            const meeting_no = parseJson(body).pmi;
                            const data = {
                                jwt_token: jwt_token,
                                zak_token: zak_token,
                                zoom_token: zoom_token,
                                meeting_no: meeting_no,
                                if_user_exists: ifUserExist
                            };
                            res.status(200).end(JSON.stringify(data));
                        });
                    } else {
                        res.status(200).end(JSON.stringify(parseJson(body.toString())));
                    }
                }
            });
        });
    });
};

async function getJWTToken() {
    const iatTemp = moment().format('YYYY-MM-DD');
    const expTemp = moment().add(1, 'days').format('YYYY-MM-DD');
    const iat = moment(iatTemp).unix();
    const exp = moment(expTemp).unix();
    let gap = exp - iat;
    return jwt.sign({
        "iss": common.app_key,
        "iat": iat, //Issue time
        "aud": null
    }, common.app_secret, {
        expiresIn: gap // expires in 1 days
    });
}

async function addZoomHost(id, db, token, callback) {

    const options = {
        "method": "POST",
        "hostname": "api.zoom.us",
        "port": null,
        "path": "/v2/users",
        "headers": {
            "content-type": "application/json",
            "authorization": "Bearer " + token
        }
    };

    let userDetail = await db.getUserById({id});
    if (userDetail.length > 0 && userDetail[0].role === common.roleTeacher) {
        const email = userDetail[0].email;
        const name = userDetail[0].name.split(/\s+/);
        let first_name = " ";
        let last_name = " ";
        if (name.length > 1) {
            first_name = name[0];
            last_name = name[1];
        } else if (name.length === 1) {
            first_name = name[0];
        }
        const clientRequest = await http.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                let body = Buffer.concat(chunks);
                callback(body.toString(), email);
            });
        });
        clientRequest.write(JSON.stringify({
            action: 'custCreate',
            user_info: {
                email: email,
                type: 2,
                first_name: first_name,
                last_name: last_name
            }
        }));
        clientRequest.end();

    } else {
        callback(common.try_again);
    }
}

async function getZAKToken(email, token, callback) {
    const options = {
        "method": "GET",
        "hostname": "api.zoom.us",
        "port": null,
        "path": "/v2/users/" + email + "/token?type=zak",
        "headers": {
            "authorization": "Bearer " + token
        }
    };

    const clientRequest = http.request(options, function (result) {
        let chunks = [];

        result.on("data", function (chunk) {
            chunks.push(chunk);
        });

        result.on("end", function () {
            let body = Buffer.concat(chunks);
            callback(parseJson(body.toString()).token);
        });
    });
    clientRequest.end();
}

async function getZoomToken(email, token, callback) {
    const oldEmail = 'admin@cyndi.in';
    const options = {
        "method": "GET",
        "hostname": "api.zoom.us",
        "port": null,
        "path": "/v2/users/" + email + "/token?type=token",
        "headers": {
            "authorization": "Bearer " + token
        }
    };

    const clientRequest = http.request(options, function (result) {
        let chunks = [];

        result.on("data", function (chunk) {
            chunks.push(chunk);
        });

        result.on("end", function () {
            let body = Buffer.concat(chunks);
            callback(parseJson(body.toString()).token);
        });
    });
    clientRequest.end();
}

async function getZoomHost(email, token, callback) {

    let options = {
        "method": "GET",
        "hostname": "api.zoom.us",
        "port": null,
        "path": "/v2/users/" + email.trim(),
        "headers": {
            "authorization": "Bearer " + token
        }
    };
    const req = http.request(options, function (res) {
        let chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            let body = Buffer.concat(chunks);
            callback(body.toString());
        });
    });
    req.end();
}

const deleteZoomHost = async (request, result) => {
    const email = req.sanitize(request.body.email);
    const last_live_class_id = req.sanitize(request.body.last_live_class_id);
    const end_time = req.sanitize(request.body.end_time);
    const user_id = req.sanitize(request.headers.user_id);


    const finalToken = await getJWTToken();


    if (last_live_class_id) {
        let response = await db.updateLiveClassStatus({last_live_class_id, end_time})
    }
    if (email) {

        let options = {
            "method": "DELETE",
            "hostname": "api.zoom.us",
            "port": null,
            "path": "/v2/users/" + email.trim() + "?action=delete",
            "headers": {
                "authorization": "Bearer " + finalToken
            }
        };
        const req = http.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                let body = Buffer.concat(chunks);
                if (!body.toString().trim()) {
                    result.status(200).end("User Deleted");
                } else {
                    result.status(201).end(parseJson(body).message);
                }

            });
        });

        req.end();

    } else {
        result.status(201).end(common.try_again);
    }
};

module.exports = {
    addZoomHost: async (req, res) => {
        const id = req.sanitize(req.headers['user_id']);
        const db = req.app.get('db');
        const jwt_token = getJWTToken();
        await addZoomHost(id, db, jwt_token, async function (body, email) {
            if (body === common.try_again) {
                result.status(201).end(common.try_again);
            } else if (body.includes('This user already exists')) {
                result.status(201).end(parseJson(body).message);
            } else {
                result.status(200).end(JSON.stringify(body.toString()));
            }
        });
    },
    getZoomHost: async (req, res) => {
        const finalToken = await getJWTToken();
        const email = req.sanitize(request.body.email);
        if (email) {
            await getZoomHost(email, finalToken, async function (details) {
                if (details.includes('first_name')) {
                    result.status(200).end(JSON.stringify(parseJson(details)));
                } else {
                    result.status(201).end(parseJson(details).message);
                }
            });
        } else {
            result.status(201).end(common.try_again);
        }
    },
    deleteZoomHost,
    getZoomCredentials: async (req, res) => {
        console.log(req.body);
        const finalToken = await getJWTToken();
        const teacherId = req.sanitize(req.body.teacher_id);
        const query = 'select email from public.profile_user where id=$1';
        const values = [teacherId];

        pool.query(query, values, async (error, results) => {
            if (error) {
                res.status(200).end(common.try_again);
            }

            if (results && results.rows.length > 0) {
                const email = results.rows[0].email;
                await getZAKToken(email, finalToken, function (token) {
                    const obj = {token: token};
                    res.status(200).end(JSON.stringify(obj));
                });
            } else {
                res.status(200).end("No Such User");
            }
        });
    },
    initializeZoomMeeting,
    getZoomMeetingRecording
};