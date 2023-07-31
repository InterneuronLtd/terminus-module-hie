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
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApirequestService } from './services/apirequest.service';
import { AppService } from './services/app.service';
import { SubjectsService } from './services/subjects.service';
import { filter, filterparam, filterParams, filters, orderbystatement, selectstatement, action, DataContract } from './models/filter.model';
import { environment } from 'src/environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Aes } from './utilities/aes';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'terminus-module-hie';

  cernerHIEResponse: SafeResourceUrl;

  toggleiFrame: boolean = false;

  currentDate: Date = new Date();

  firstName: string;

  lastName: string;

  nhsNumber: string;

  dateOfBirth: string;

  loggedInUsername: string;

  loggedInUserDisplayName: string;

  loggedInUserPosition: string;

  idTypeCode: string;

  @Input() set datacontract(value: DataContract) {
    this.appService.personId = value.personId;
    this.appService.apiService = value.apiService;
    this.subjects.unload = value.unload;
    this.initConfigAndGetMeta(this.appService.apiService);
  }

  @Output() frameworkAction = new EventEmitter<string>();

  subscriptions: Subscription = new Subscription();

  EmitFrameworkEvent(e: string) {
    this.frameworkAction.emit(e);
  }

  constructor(private subjects: SubjectsService, public appService: AppService, private apiRequest: ApirequestService, private sanitizer: DomSanitizer) {
    if (!environment.production)
      this.initDevMode();
  }

  ngOnDestroy() {
    this.appService.logToConsole("app component being unloaded");
    this.appService.encounter = null;
    this.appService.personId = null;
    this.appService.isCurrentEncouner = null;
    this.appService.reset();
    this.subscriptions.unsubscribe();
    this.appService = null;

    this.subjects.unload.next("app-hie");
  }

  initDevMode() {
    //commment out to push to framework - 3lines
    this.appService.personId = "96ebefbe-a2e0-4e76-8802-e577e28fcc23" // "fe8a22fa-203d-4563-abe3-8818f37945d9"//"774c605e-c2c6-478d-90e6-0c1230b3b223";//"4d05aff8-123f-4ca9-be06-f9734905c02f"//"d91ef1fa-e9c0-45ba-9e92-1e1c4fd468a2"// "027c3400-24cd-45c1-9e3d-0f4475336394" ;//  "6b187a8b-1835-42c2-9cd5-91aa0e39f0f7";//"6b187a8b-1835-42c2-9cd5-91aa0e39f0f7"//"774c605e-c2c6-478d-90e6-0c1230b3b223";//"0422d1d0-a9d2-426a-b0b2-d21441e2f045";//"6b187a8b-1835-42c2-9cd5-91aa0e39f0f7"; //"17775da9-8e71-4a3f-9042-4cdcbf97efec";// "429904ca-19c1-4a3a-b453-617c7db513a3";//"027c3400-24cd-45c1-9e3d-0f4475336394";//"429904ca-19c1-4a3a-b453-617c7db513a3";
    let value: any = {};
    value.authService = {};
    value.authService.user = {};
    let auth = this.apiRequest.authService;
    auth.getToken().then((token) => {
      value.authService.user.access_token = token;
      //console.log("token:" + token);
      this.initConfigAndGetMeta(value);
    });
  }

  initConfigAndGetMeta(value: any) {
    //console.log(value);
    this.appService.apiService = value;
    this.subscriptions.add(this.apiRequest.getRequest("./assets/config/HIEConfig.json?V" + Math.random()).subscribe(
      (response) => {
        this.appService.appConfig = response;
        this.appService.baseURI = this.appService.appConfig.uris.baseuri;
        this.appService.cernerHIEUri = this.appService.appConfig.uris.cernerhiebaseuri;
        this.appService.cernerEncryptionPassword = this.appService.appConfig.cernerencryptionpassword;
        this.appService.cernerNbitsEncryption = this.appService.appConfig.cernernbitsencryption;
        this.appService.cernerExternal = this.appService.appConfig.cernerexternal;
        this.appService.cernerOrgUser = this.appService.appConfig.cernerorguser;
        this.appService.cernerOrgPassword = this.appService.appConfig.cernerorgpassword;
        this.appService.enableLogging = this.appService.appConfig.enablelogging;
        this.idTypeCode = this.appService.appConfig.idtypecode;
        this.subscriptions.add(this.apiRequest.getRequest(`${this.appService.baseURI}/GetObject?synapsenamespace=core&synapseentityname=person&id=${this.appService.personId}`).subscribe(
          (person) => {
            person = JSON.parse(person);
            //console.log(person);
            if (person && person.dateofbirth) {
              this.appService.personDOB = person.dateofbirth as Date;

              this.dateOfBirth = this.getDOB(this.appService.personDOB);
              this.firstName = person.firstname;
              this.lastName = person.familyname;
            }

            //get all meta before emitting events
            //all components depending on meta should perform any action only after receiveing these events
            //use await on requets that are mandatory before the below events can be fired.

            //emit events after getting initial config. //this happens on first load only.
            //this.appService.logToConsole("Service reference is being published from init config");
            this.subjects.apiServiceReferenceChange.next();
            //this.appService.logToConsole("personid is being published from init config");
            this.subjects.personIdChange.next();

          }));

      }));
  }

  getDOB(date: Date): string {
    var dt = new Date(date);
    let year = dt.getFullYear();
    let month = (dt.getMonth() + 1);
    let day = dt.getDate();

    let returndate = year.toString() + (month < 10 ? "0" + month : month) + (day < 10 ? "0" + day : day);

    return returndate;
  }

  IsHIELevelUser() {
    let decodedToken: any;
    if (this.appService.apiService) {
      decodedToken = this.appService.decodeAccessToken(this.appService.apiService.authService.user.access_token);
      if (decodedToken != null) {
        this.getUserRoles(decodedToken);

        this.appService.loggedInUserName = decodedToken.name ? (Array.isArray(decodedToken.name) ? decodedToken.name[0] : decodedToken.name) : decodedToken.IPUId;
        //this.appService.logToConsole(`User Name: ${decodedToken.name}`);
        //this.appService.logToConsole(`User Role: ${decodedToken.SynapseRoles}`);
        this.loggedInUsername = decodedToken.IPUId;
        this.loggedInUserDisplayName = decodedToken.name;


        let userRoles = this.appService.loggedInUserRoles;

        if (userRoles.includes("HIE Level 1")) {
          this.loggedInUserPosition = "HIE Level 1";
          //console.log(this.loggedInUserPosition);
        }
        else if (userRoles.includes("HIE Level 2")) {
          this.loggedInUserPosition = "HIE Level 2";
          //console.log(this.loggedInUserPosition);
        }
        else if (userRoles.includes("HIE Level 3")) {
          this.loggedInUserPosition = "HIE Level 3";
          //console.log(this.loggedInUserPosition);
        }
        else if (userRoles.includes("HIE Level 4")) {
          this.loggedInUserPosition = "HIE Level 4";
          //console.log(this.loggedInUserPosition);
        }

        if (userRoles.includes("HIE Level 1") || userRoles.includes("HIE Level 2") || userRoles.includes("HIE Level 3") || userRoles.includes("HIE Level 4")) {
          return true;
        }

        if (!environment.production)
          this.appService.loggedInUserName = "Dev Team";

        //this.appService.logToConsole(this.appService.loggedInUserName);
      }
    }
    else {
      let token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhjZjc5YzFlZGJkYzI4YTVlOTBmMzlkYWRkZjMyZTYzIiwidHlwIjoiSldUIn0.eyJuYmYiOjE2MzIyMTQ2MjIsImV4cCI6MTYzMjIxODIyMiwiaXNzIjoiaHR0cHM6Ly9zeW5hcHNlaWRlbnRpdHlzZXJ2ZXIuYXp1cmV3ZWJzaXRlcy5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9zeW5hcHNlaWRlbnRpdHlzZXJ2ZXIuYXp1cmV3ZWJzaXRlcy5uZXQvcmVzb3VyY2VzIiwiZHluYW1pY2FwaSIsImNhcmVyZWNvcmRhcGkiLCJ0ZXJtaW5vbG9neWFwaSJdLCJjbGllbnRfaWQiOiJ0ZXJtaW51cy1mcmFtZXdvcmsiLCJzdWIiOiIzYzkxZTliMC01Y2YyLTRhOTYtODZjNy01ZTUzNTllYTIzNjUiLCJhdXRoX3RpbWUiOjE2MzIyMDY5ODYsImlkcCI6ImxvY2FsIiwibmFtZSI6ImdhdXRhbUBpbnRlcm5ldXJvbi5vcmciLCJlbWFpbCI6ImdhdXRhbUBpbnRlcm5ldXJvbi5vcmciLCJJUFVJZCI6ImdhdXRhbUBpbnRlcm5ldXJvbi5vcmciLCJTeW5hcHNlUm9sZXMiOlsiUGhhcm1hY2lzdCIsIlBISSBVc2VyIiwiSElFIExldmVsIDIiLCJEeW5hbWljQXBpV3JpdGVycyIsIlJFRyBOdXJzZSIsIkludGVybmV1cm9uIl0sInNjb3BlIjpbIm9wZW5pZCIsInByb2ZpbGUiLCJkeW5hbWljYXBpLnJlYWQiLCJjYXJlcmVjb3JkYXBpLnJlYWQiLCJ0ZXJtaW5vbG9neWFwaS5yZWFkIl0sImFtciI6WyJwd2QiXX0.mZzPRca3dHkbfB0pVxA_w4ttGKjZbQRIc8sS2zDtbEpfwQgy1P8FuZROG7roIEcdbg_MfuhXz4VHE_c4YQmCYlVjq3ooGZ1boFEGsKE6VDV1bdzeWw39ci3NoE10WsOmX3F__iTh6cvmZU0gVzF8K9kX2qbpfQBcbfp-kyHkRA-VaglF1J8xKbD_m8YgZ_oohJQXCk4bVBtYEKFTD-p3VbC6iGOUEPjwCios5XENdAQSUJkaHuqeS_OubkL1_Wfw6-5TC6FFfK1wpURMuCvkQkpgUXFM3WLBY4R8NPqNMU7I85CCQPgllSGlLGjGe7jxU-T2ab5FkuYSokQNxBB_Aw";
      decodedToken = this.appService.decodeAccessToken(token);

      if (decodedToken != null) {
        let userRoles = decodedToken.SynapseRoles;

        if (userRoles.includes("HIE Level 1") || userRoles.includes("HIE Level 2") || userRoles.includes("HIE Level 3") || userRoles.includes("HIE Level 4")) {
          return true;
        }
      }
    }

    return false;
  }

  createPersonIdentifierFilter(personId: string) {

    let condition = "";
    let pm = new filterParams();

    condition = "person_id = @person_id and idtypecode = '" + this.idTypeCode + "'";
    pm.filterparams.push(new filterparam("person_id", personId));

    let f = new filters();
    f.filters.push(new filter(condition));

    let select = new selectstatement("SELECT idnumber");

    let orderby = new orderbystatement("ORDER BY 1");

    let body = [];
    body.push(f);
    body.push(pm);
    body.push(select);
    body.push(orderby);

    return JSON.stringify(body);
  }

  getUserRoles(decodedToken: any) {
    this.appService.loggedInUserRoles = [];
    let synapseroles;
    if (environment.production)
      synapseroles = decodedToken.SynapseRoles
    else
      synapseroles = decodedToken.client_SynapseRoles
    if (!Array.isArray(synapseroles)) {

      this.appService.loggedInUserRoles.push(synapseroles);
    }
    else
      for (var i = 0; i < synapseroles.length; i++) {
        this.appService.loggedInUserRoles.push(synapseroles[i]);
      }

  }

  ngOnInit(): void {

    var utcDate = new Date(this.currentDate.getUTCFullYear(), this.currentDate.getUTCMonth(), this.currentDate.getUTCDate(), this.currentDate.getUTCHours(), this.currentDate.getUTCMinutes(), this.currentDate.getUTCSeconds());
    var isoDate = this.appService.getDateTimeinISOFormat(utcDate);

    this.currentDate = utcDate;

    var HIELevelUser = this.IsHIELevelUser();

    this.subjects.personIdChange.subscribe(() => {
      if (this.appService != null) {
        this.subscriptions.add(this.apiRequest.postRequest(this.appService.baseURI + "/GetListByPost?synapsenamespace=core&synapseentityname=personidentifier", this.createPersonIdentifierFilter(this.appService.personId)).subscribe(
          (personidentifier) => {

            if (personidentifier && personidentifier.length > 0) {
              this.nhsNumber = personidentifier[0].idnumber;

              if (HIELevelUser && this.nhsNumber != "" && this.nhsNumber != null) {
                var cernerUri = this.appService.cernerHIEUri;
                var password = this.appService.cernerEncryptionPassword;
                var nBits = this.appService.cernerNbitsEncryption;

                var external = this.appService.cernerExternal;
                var orgUser = this.appService.cernerOrgUser;
                var orgPassword = this.appService.cernerOrgPassword;

                //get random value from array
                // var patients = [
                //   "PAT_CMRN=4853379371&USR_NAME=GAUTAM.BHATT&USR_POSITION=HIE Level 1&USR_DSPLYNM=BHATT,GAUTAM&USR_ORG=RAN&USR_FAC=RAN&PAT_FNAME=SARAH&PAT_LNAME=JORDAN&PAT_DOB=19220821&EXTERNAL="+ external +"&PERMISSION=Yes&EXPIRATION=" + isoDate.substring(0, isoDate.length - 4) +"&ORG_USER="+ orgUser +"&ORG_PASS=" + orgPassword, 
                //   "PAT_CMRN=9620344472&USR_NAME=GAUTAM.BHATT&USR_POSITION=HIE Level 2&USR_DSPLYNM=BHATT,GAUTAM&USR_ORG=RAN&USR_FAC=RAN&PAT_FNAME=DOROTHY&PAT_LNAME=MORRISON&PAT_DOB=19710210&EXTERNAL="+ external +"&PERMISSION=Yes&EXPIRATION=" + isoDate.substring(0, isoDate.length - 4) +"&ORG_USER="+ orgUser +"&ORG_PASS=" + orgPassword,
                //   "PAT_CMRN=4160066348&USR_NAME=GAUTAM.BHATT&USR_POSITION=HIE Level 4&USR_DSPLYNM=BHATT,GAUTAM&USR_ORG=RAN&USR_FAC=RAN&PAT_FNAME=RICHARD&PAT_LNAME=GARNER&PAT_DOB=19331221&EXTERNAL="+ external +"&PERMISSION=Yes&EXPIRATION=" + isoDate.substring(0, isoDate.length - 4) +"&ORG_USER="+ orgUser +"&ORG_PASS=" + orgPassword,
                //   "PAT_CMRN=5894678846&USR_NAME=GAUTAM.BHATT&USR_POSITION=HIE Level 1&USR_DSPLYNM=BHATT,GAUTAM&USR_ORG=RAN&USR_FAC=RAN&PAT_FNAME=NEIL&PAT_LNAME=MATTHEWS&PAT_DOB=19390204&EXTERNAL="+ external +"&PERMISSION=Yes&EXPIRATION=" + isoDate.substring(0, isoDate.length - 4) +"&ORG_USER="+ orgUser +"&ORG_PASS=" + orgPassword,
                //   "PAT_CMRN=6068998983&USR_NAME=GAUTAM.BHATT&USR_POSITION=HIE Level 3&USR_DSPLYNM=BHATT,GAUTAM&USR_ORG=RAN&USR_FAC=RAN&PAT_FNAME=GRAHAM&PAT_LNAME=HENRY&PAT_DOB=19650303&EXTERNAL="+ external +"&PERMISSION=Yes&EXPIRATION=" + isoDate.substring(0, isoDate.length - 4) +"&ORG_USER="+ orgUser +"&ORG_PASS=" + orgPassword
                // ];
                // var randomPatient = patients[Math.floor(Math.random() * patients.length)];
                var randomPatient = "PAT_CMRN=" + this.nhsNumber + "&USR_NAME=" + this.loggedInUsername + "&USR_POSITION=" + this.loggedInUserPosition + "&USR_DSPLYNM=" + this.loggedInUserDisplayName + "&USR_ORG=RAN&USR_FAC=RAN&PAT_FNAME=" + this.firstName + "&PAT_LNAME=" + this.lastName + "&PAT_DOB=" + this.dateOfBirth.substring(0, 10) + "&EXTERNAL=" + external + "&PERMISSION=Yes&EXPIRATION=" + isoDate.substring(0, isoDate.length - 4) + "&ORG_USER=" + orgUser + "&ORG_PASS=" + orgPassword;
                //console.log(randomPatient);

                var cipherText = Aes.Ctr.encrypt(randomPatient, password, nBits);
                //console.log(cipherText);

                this.toggleiFrame = false;
                this.cernerHIEResponse = this.sanitizer.bypassSecurityTrustResourceUrl(`${cernerUri}?${cipherText}`);
                this.toggleiFrame = true;
              }
            }
          }
        ));
      }
    });
  }
}
