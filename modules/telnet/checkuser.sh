#!/bin/bash

checkuser()
{
   awk -F":" '{ print $1 }' /etc/passwd | grep -x $1 > /dev/null
   return $?
}

checkuser $1
if [ $? != 0 ]; then
    adduser --disabled-password --gecos "" $1
    mkdir /home/$1/.ssh
    cp $2 /home/$1/.ssh/authorized_keys
    chown $1:$1 /home/$1/.ssh/
    chown $1:$1 /home/$1/.ssh/authorized_keys
    chmod 700 /home/$1/.ssh/
    chmod 700 /home/$1/.ssh/authorized_keys
fi

