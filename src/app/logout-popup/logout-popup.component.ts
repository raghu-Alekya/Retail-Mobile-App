import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-logout-popup',
  templateUrl: './logout-popup.component.html',
  styleUrls: ['./logout-popup.component.scss'],
})
export class LogoutPopupComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

  countdown = 5;

}
