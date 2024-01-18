// creating a database connection
const Pool = require('pg').Pool;
const connectionString = {
    host: 'localhost',
    port: 5432,
    database: 'sat_db',
    user: 'postgres',
    password: 'redhat'
};

const tempConnectionString = {
    host: 'localhost',
    port: 5432,
    database: 'sat_db',
    user: 'postgres',
    password: 'redhat'
};

let roleStudent = 1;
let roleTeacher = 2;
let roleExpert = 3;
let roleAlumnus = 4;
let roleGuest = 5;
let roleCompany = 6;
let roleEmployee = 7;

module.exports = {
    //Connection String used by Massive to connect to the database
    connection_string: connectionString,

    connection: new Pool(connectionString),

    //Session key for Express-session
    session_key: 'Cyndi_Session123$',
    app_key: 'Luxk2PdtS3eN3WsS6fXudg',
    app_secret: '2JmQ0t7COw5YTNQhEQlmGWFplS3UrGZT9q51',

    //Message to show in case of invalid data passed from frontend
    try_again: 'Invalid details, please try again',

    //Server Port
    server_port: 4000,

    mailer_string: {
        host: 'smtpout.asia.secureserver.net',
        port: 465,
        auth: {
            user: 'admin@cyndi.in',
            pass: 'Admingd2020%'
        },
        tls: {
            rejectUnauthorized: false
        }
    },

    //All the roles of Cyndi
    roleStudent: 1,
    roleTeacher: 2,
    roleExpert: 3,
    roleAlumnus: 4,
    roleGuest: 5,
    roleCompany: 6,
    roleEmployee: 7,

    getRoleName: (role) => {
        switch (role) {
            case roleStudent: {
                return 'Student';
            }
            case roleTeacher: {
                return 'Teacher';
            }
            case roleExpert: {
                return 'Expert';
            }
            case roleAlumnus: {
                return 'Alumnus';
            }
            case roleGuest: {
                return 'Guest';
            }
            case roleCompany: {
                return 'Company';
            }
            default: {
                return 'Employee';
            }
        }
    }

};
