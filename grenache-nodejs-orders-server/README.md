# Grenache orders example server

Install Grape:

```
npm i -g grenache-grape
```

Start 2 Grapes:

```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

Boot the server:

```
node server.js
```

Test:

1. Create test environment:
```
./test-env.sh
```

2. Run client request
```
LINK='http://127.0.0.1:30001' node ../grenache-nodejs-orders-client/client.js
```

3. Check client output to be:
```
User sent: {"amount":100,"type":"buy"} and received: {"amount":100,"type":"buy","linkUrl":"http://127.0.0.1:40001"}
```

Issues:

1. Grenache client picks arbitrary server so it an order can be distributed to the same client server and cause duplication order error. I expected it always to be destributed to the server spicified in configuration to correspond the task requirements.
2. It makes sense to catch all uncaught exceptions to prevent server chrash and restart.
3. Orders matching mechanism is not clear from the task description so simple order push and rejection for duplicates were impelemented.