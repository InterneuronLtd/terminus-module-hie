//BEGIN LICENSE BLOCK 
//Interneuron Terminus

//Copyright(C) 2023  Interneuron Holdings Ltd

//This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//(at your option) any later version.

//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

//See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program.If not, see<http://www.gnu.org/licenses/>.
//END LICENSE BLOCK 
import { Injectable } from '@angular/core';
import { Encounter } from '../models/encounter.model';
import jwt_decode from 'jwt-decode';
import { action } from '../models/filter.model';
import * as moment from 'moment';


@Injectable({
  providedIn: 'root'
})

export class AppService {
  personAgeInDays: number;
  isAppDataReady: boolean;

  constructor() { }
  public enableLogging = true;
  public appConfig: any;
  public apiService: any;
  public baseURI: string;
  public cernerHIEUri: string;
  public personId: string;
  public encounter: Encounter;
  public isCurrentEncouner = false;
  public events: any = [];
 
  public roleActions: action[] = [];
  public loggedInUserName: string = null;
  public personAgeAtAdmission: number;
  public personDOB: Date;
  public loggedInUserRoles: Array<string> = [];
  public patientDetails;
  public encounterDetails;
  public cernerEncryptionPassword: string;
  public cernerNbitsEncryption: number;
  public cernerExternal: string;
  public cernerOrgUser: string;
  public cernerOrgPassword: string;
 
  reset(): void {
    this.personId = null;
    this.encounter = null;
    this.isCurrentEncouner = false;
    this.apiService = null;
    this.baseURI = null;
    this.cernerHIEUri = null;
    this.loggedInUserName = null;
    this.enableLogging = true;
    this.roleActions = [];
    this.personDOB = null;
    this.personAgeAtAdmission = null;
    this.events = null;
    this.roleActions = [];
    this.loggedInUserName = null;
    this.personAgeAtAdmission = null;
    this.personDOB = null;
    this.loggedInUserRoles= [];
    this.cernerEncryptionPassword = null;
    this.cernerNbitsEncryption = null;
    this.cernerExternal = null;
  }

  decodeAccessToken(token: string): any {
    try {
      return jwt_decode(token);
    }
    catch (Error) {
      this.logToConsole(`Error: ${Error}`);
      return null;
    }
  }

  public AuthoriseAction(action: string): boolean {
    return this.roleActions.filter(x => x.actionname.toLowerCase().trim() == action.toLowerCase()).length > 0;
  }

  public getDateTimeinISOFormat(date: Date): string {
    var time = date;
    var hours = time.getHours();
    var s = time.getSeconds();
    var m = time.getMilliseconds()
    var minutes = time.getMinutes();
    date.setHours(hours);
    date.setMinutes(minutes);
    //date.setSeconds(s);
    //date.setMilliseconds(m);
    //this.appService.logToConsole(date);
    let year = date.getFullYear();
    let month = (date.getMonth() + 1);
    let dt = date.getDate();
    let hrs = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let msecs = date.getMilliseconds();
    let returndate = (year + "-" + (month < 10 ? "0" + month : month) + "-" + (dt < 10 ? "0" + dt : dt) + "T" + (hrs < 10 ? "0" + hrs : hrs) + ":" + (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs) + "." + (msecs < 10 ? "00" + msecs : (msecs < 100 ? "0" + msecs : msecs)));
    //this.appService.logToConsole(returndate);
    return returndate;
  }

  setPatientAgeAtAdmission() {
    this.personAgeAtAdmission = moment(this.encounter.admitdatetime, moment.ISO_8601).diff(moment(this.personDOB, moment.ISO_8601), "years");
    this.personAgeInDays = moment(this.encounter.admitdatetime, moment.ISO_8601).diff(moment(this.personDOB, moment.ISO_8601), "days");

  }

  logToConsole(msg: any) {
    if (this.enableLogging) {
      console.log(msg);
    }
  }
}



