import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.css']
})
export class PlanesComponent implements OnInit {

  ngOnInit(): void {
  }

}