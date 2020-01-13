#!/bin/bash

git add -A
git commit -m "$1"
git push
ssh -i ~/.ssh/pems/mybox.pem ec2-user@ec2-34-239-143-28.compute-1.amazonaws.com "cd InfosageVoice/; git pull"
