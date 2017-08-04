'use strict';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { dbFoundations } from '../../db/dbFoundations';
import { formatDateText } from '../utils/helpers';
import { config } from '../../config';
import { addTask, resolveTask } from '../layout/loading';

export const rKeyword = new ReactiveVar('');
Template.foundationPlan.onCreated(function() {
  this.offset = 0;
  this.autorun(() => {
    addTask();
    this.subscribe('foundationPlan', rKeyword.get(), this.offset, resolveTask);
  });
});
Template.foundationPlan.helpers({
  getFoundCompanyHref() {
    return FlowRouter.path('foundCompany');
  },
  foundationList() {
    return dbFoundations.find({}, {
      sort: {
        createdAt: 1
      }
    });
  }
});
Template.foundationPlan.events({
  'click [data-action="more"]'(event, templateInstance) {
    event.preventDefault();
    templateInstance.offset += 10;
    addTask();
    templateInstance.subscribe('foundationPlan', rKeyword.get(), templateInstance.offset, resolveTask);
  }
});

Template.foundationFilterForm.onRendered(function() {
  this.$keyword = this.$('[name="keyword"]');
});
Template.foundationFilterForm.helpers({
  keyword() {
    return rKeyword.get();
  }
});
Template.foundationFilterForm.events({
  submit(event, templateInstance) {
    event.preventDefault();
    rKeyword.set(templateInstance.$keyword.val());
  }
});

Template.foundationPlanInfo.helpers({
  displayTagList(tagList) {
    return tagList.join('、');
  },
  investPplsNumberClass(investNumber) {
    return (investNumber >= config.foundationNeedUsers) ? 'col content text-success text-right' : 'col content text-danger text-right';
  },
  foundationNeedUsers() {
    return config.foundationNeedUsers;
  },
  getTotalInvest(investList) {
    return _.reduce(investList, (totalInvest, investData) => {
      return totalInvest + investData.amount;
    }, 0);
  },
  getExpireDateText(createdAt) {
    const expireDate = new Date(createdAt.getTime() + config.foundExpireTime);

    return formatDateText(expireDate);
  },
  isManager(manager) {
    const user = Meteor.user();

    return user && user.username === manager;
  },
  getEditHref(foundationId) {
    return FlowRouter.path('editFoundationPlan', {foundationId});
  },
  alreadyInvest(investList) {
    const user = Meteor.user();
    const username = user && user.username;
    const investData = _.findWhere(investList, {username});

    return investData ? investData.amount : 0;
  }
});
Template.foundationPlanInfo.events({
  'click [data-action="invest"]'(event, templaceInstance) {
    event.preventDefault();
    const minimumInvest = Math.ceil(config.beginReleaseStock / config.foundationNeedUsers);
    const maximumInvest = Meteor.user().profile.money;
    const amount = parseInt(window.prompt(`要投資多少金額？(${minimumInvest}~${maximumInvest})`), 10);
    if (amount >= minimumInvest && amount <= maximumInvest) {
      Meteor.call('investFoundCompany', templaceInstance.data.companyName, amount);
    }
    else {
      window.alert('不正確的金額數字！');
    }
  }
});
