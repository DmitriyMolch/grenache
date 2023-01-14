#!/bin/bash
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002' &
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001' &
LINK='http://127.0.0.1:30001' PULL_URLS='http://127.0.0.1:40001' node server.js &
LINK='http://127.0.0.1:40001' PULL_URLS='http://127.0.0.1:30001' node server.js