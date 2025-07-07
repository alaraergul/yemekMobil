import { Component } from '@angular/core';
import { UserService } from '../services/user/user.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.userService.getUsers().subscribe(res => console.log(res))
  }

}
