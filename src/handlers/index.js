'use strict'

const totp = require("totp-generator");
const axios = require('axios');
const axiosRetry = require('axios-retry');

const TIMEOUT = 1000
const RETRY_DELAY = 300
const RETRY_COUNT = 3

exports.handler = async(event) => {
    console.debug(`Event received is: ${JSON.stringify(event)}`);
    
    const token = totp("JBSWY3DPEHPK3PXPXX");
    const url = "";

    axiosRetry(axios, {
        retries: RETRY_COUNT,
        shouldResetTimeout: true,
        retryDelay: (retryCount) => {
            return RETRY_DELAY
        },
        retryCondition: (error) => {
            console.error(error)
            return isServerError(error) || isTimeoutError(error)
        },
    });
    
    await axios.post(url, {text: `Your token is: ${token}`}, { timeout: TIMEOUT, headers: {'Content-Type': 'application/json'} })
        .then(data => {
            //metrics.counter('middleware.post.response.ok')
            console.debug(`Response from Slack: ${data}`)
            return data;
        })
        .catch(error => {
            if (error.response) {
                console.error(`[TOTP] Error sending message to Slack - status: ${error.response.status} - response: ${error.response.data}`)
                //metrics.counter(`middleware.post.response.${error.response.status}`)
            } else if (isTimeoutError(error)) {
                console.error(`[TOTP] Error sending message to Slack - TIMEOUT`)
                //metrics.counter(`middleware.post.response.timeout`)
            }
            throw error;
        });
};

function isTimeoutError(error) {
    return error.code === 'ECONNABORTED'
}

function isServerError(error) {
    return error.response && error.response.status >= 500 && error.response.status < 600
}
