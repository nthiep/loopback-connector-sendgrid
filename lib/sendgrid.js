"use strict";
var assert = require('assert');
var R = require('ramda');
var Q = require('q');
var Mailer = function Mailer() {};
var sendGridLib = require('sendgrid');
var helper = require('sendgrid').mail;
/* eslint-disable no-unused-vars */
var sendgridInstance = {};
var sendgridMailSettings = {};
var sendgridTrackingSettings = {};
/* eslint-enable no-unused-vars */

var SendgridConnector = function SendgridConnector(settings) {
  assert(typeof settings === 'object', 'cannot init connector without settings');
  assert(typeof settings.api_key === 'string', 'cannot init connector without api key');
  if (settings.api_key){
    this.sendgrid = sendGridLib(settings.api_key); //eslint-disable-line
  }

  this.sendgridMailSettings = settings.mail_settings;
  this.sendgridTrackingSettings = settings.tracking_settings;
  sendgridMailSettings = this.sendgridMailSettings;
  sendgridTrackingSettings = this.sendgridTrackingSettings;
  sendgridInstance = this.sendgrid;
};

SendgridConnector.initialize = function (dataSource, callback) {
  dataSource.connector = new SendgridConnector(dataSource.settings);
  callback();
};

SendgridConnector.prototype.DataAccessObject = Mailer;

/**
 * Send transactional email with options
 * Full list of options are available here: https://www.npmjs.com/package/sendgrid#available-params
 *
 * @param {Object} options
 * {
 *   from: { name: "John", email: "john@cellarise.com" },
 *   to: "mail@cellarise.com",
 *   subject: "Test mail",
 *   text: "Plain text message",
 *   html: "<b>Html messages</b> here"
 * }
 *
 * @param {Function} cb callback
 * @returns {Function} deferred promise
 */
Mailer.send = function (options, cb) { // eslint-disable-line
  var dataSource = this.dataSource,
    connector = dataSource.connector,
    deferred = Q.defer(),
    sendgridMessage = {},
    sendgridEmail,
    request;

  var fn = function (err, result) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
    return cb && cb(err, result);
  };

  if (options.__data) {
    options = R.clone(options.__data);
  } else {
    options = R.clone(options);
  }

  assert(connector, 'Cannot send mail without a connector!');

  if (connector.sendgrid) {

    //email from param
    if (R.is(String, options.from)) {
      sendgridMessage.from = options.from;
    } else if (R.is(Object, options.from)) {
      sendgridMessage.fromname = options.from.name;
      if (options.from.hasOwnProperty('address')) {
        sendgridMessage.from = options.from.address;
      } else if (options.from.hasOwnProperty('email')) {
        sendgridMessage.from = options.from.email;
      }
    } else {
      if (options.from_name) {
        sendgridMessage.fromname = options.from_name || '';
      }
      if (options.from_email) {
        sendgridMessage.from = options.from_email || '';
      }
    }
    delete options.from;

    //email to param
    if (R.is(String, options.to)) {
      sendgridMessage.toList = options.to.split(',');
    } else if (R.is(Object, options.to)) {
      sendgridMessage.toList = [options.to];
    } else {
      sendgridMessage.toList = options.to;
    }
    delete options.to;
    if (R.is(Array, sendgridMessage.toList)) {
      sendgridMessage.to = sendgridMessage.toList[0];
    }
    //basic sendgrid email
    sendgridEmail = new helper.Mail(
      new helper.Email(sendgridMessage.from, sendgridMessage.fromname),
      options.subject,
      new helper.Email(sendgridMessage.to),
      new helper.Content("text/plain", options.text || '')
    );
    if (options.html) {
      sendgridEmail.addContent(new helper.Content("text/html", options.html));
    }
    //add to email
    if (R.is(Array, sendgridMessage.toList)) {
      R.forEach(function eachMail(mail){
        if (mail !== sendgridMessage.to){
          var email = new helper.Email(mail);
          sendgridEmail.personalizations[0].addTo(email);
        }
      }, sendgridMessage.toList);
    }

    //attachments
    if (R.is(Array, options.attachments)) {
      R.forEach(function eachFile(fileConfig){
        sendgridEmail.addAttachment(fileConfig);
      }, options.attachments);
    }
    if (options.files) {
      R.forEach(function eachFile(fileConfig){
        sendgridEmail.addAttachment(fileConfig);
      }, options.files);
    }

    //sendgrid mail settings
    if (sendgridMailSettings) {
      sendgridEmail.addMailSettings(sendgridMailSettings);
    }
    //trackingSettings
    if (sendgridTrackingSettings) {
      sendgridEmail.addTrackingSettings(sendgridTrackingSettings);
    }
    //Sendgrid options
    if (options.sendGridConfig) {
      //personalizations
      if (R.is(Array, options.sendGridConfig.personalizations)) {
        R.forEach(function eachPers(personalization){
          sendgridEmail.addPersonalization(personalization);
        }, options.sendGridConfig.personalizations);
      }
      //sections
      if (R.is(Array, options.sendGridConfig.sections)) {
        R.forEach(function eachSec(section){
          sendgridEmail.addSection(section);
        }, options.sendGridConfig.sections);
      }
      //headers
      if (R.is(Array, options.sendGridConfig.headers)) {
        R.forEach(function eachHeader(header){
          sendgridEmail.addHeader(header);
        }, options.sendGridConfig.headers);
      }
      //personalizations
      if (R.is(Array, options.sendGridConfig.personalizations)) {
        R.forEach(function eachPers(personalization){
          sendgridEmail.addPersonalization(personalization);
        }, options.sendGridConfig.personalizations);
      }
      //templateId
      if (options.sendGridConfig.templateId) {
        sendgridEmail.setTemplateId(options.sendGridConfig.templateId);
      }
      //sendAt
      if (options.sendGridConfig.sendAt) {
        sendgridEmail.setSendAt(options.sendGridConfig.sendAt);
      }
      //batchId
      if (options.sendGridConfig.batchId) {
        sendgridEmail.setBatchId(options.sendGridConfig.batchId);
      }
      //asm
      if (options.sendGridConfig.asm) {
        sendgridEmail.setAsm(options.sendGridConfig.asm);
      }
      //ipPoolName
      if (options.sendGridConfig.ipPoolName) {
        sendgridEmail.setIpPoolName(options.sendGridConfig.ipPoolName);
      }
      //replyTo
      if (options.sendGridConfig.replyTo) {
        sendgridEmail.setReplyTo(options.sendGridConfig.replyTo);
      }
      //categories
      if (R.is(Array, options.sendGridConfig.categories)) {
        R.forEach(function eachCategory(category){
          sendgridEmail.addCategory(category);
        }, options.sendGridConfig.categories);
      }
    }
    request = connector.sendgrid.emptyRequest();
    request.method = 'POST';
    request.path = '/v3/mail/send';
    request.body = sendgridEmail.toJSON();
    connector.sendgrid.API(request, function sgCb(response){ // eslint-disable-line
      if (response.statusCode === 200 || response.statusCode === "200" ||
      response.statusCode === 202 || response.statusCode === "202") {
        fn(null, response);
      } else {
        fn(response);
      }
    });
  } else {
    process.nextTick(function () {
      fn(null, options);
    });
  }
  return deferred.promise;
};

/**
 * Send an email instance using instance
 */

Mailer.prototype.send = function (fn) {
  return this.constructor.send(this, fn);
};

/**
 * Export the connector class
 */
module.exports = SendgridConnector;
