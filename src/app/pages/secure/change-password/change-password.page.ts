import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePasswordPage implements OnInit {

  // 👇 ADD THESE
  showOld: boolean = false;
  showNew: boolean = false;
  showConfirm: boolean = false;

  constructor() { }

  ngOnInit() {
  }

}