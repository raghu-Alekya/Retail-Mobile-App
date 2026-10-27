import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-edit-user',
    templateUrl: './edit-user.component.html',
    standalone: false
})
export class EditUserComponent implements OnInit {

  @Input() user: any;

  originalUser: any;
  editedUser: any;
  isChanged = false;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.originalUser = { ...this.user };
    this.editedUser = { ...this.user };
  }

  checkChanges() {
    this.isChanged =
      JSON.stringify(this.originalUser) !==
      JSON.stringify(this.editedUser);
  }

  close() {
    this.modalCtrl.dismiss();
  }

  saveChanges() {
    this.modalCtrl.dismiss({ updated: true });
  }
}