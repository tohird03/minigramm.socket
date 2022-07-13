CREATE DATABASE msg;

CREATE TABLE msg(
    user_id bigserial not null PRIMARY KEY,
    user_fullname varchar(28) not null,
    user_email varchar(32) not null,
    user_password text not null
);

SELECT * FROM msg WHERE user_id = 1;

INSERT INTO msg(user_fullname, user_email, user_password) VALUES('Mashrab Yoldoshev', 'mashrabyoldaoshev@gmail.com', 'asdfasdfasdfadfasdf');

CREATE TABLE user_msg(
    msg_id bigserial not null,
    user_id int not null,
        FOREIGN KEY(user_id)
            REFERENCES msg(user_id),
    msg_text text,
    send_data timestamptz DEFAULT CURRENT_TIMESTAMP not null
);

INSERT INTO user_msg(user_id, msg_text) VALUES(21, 'Salomlar');

SELECT
    m.user_id,
    m.user_fullname,
    m.user_email,
    um.msg_id,
    um.msg_text,
    um.send_data
FROM
    msg m
INNER JOIN
    user_msg um
ON
    m.user_id = um.user_id
ORDER BY
    um.msg_id;