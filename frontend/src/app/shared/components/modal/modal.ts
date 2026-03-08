import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class ModalComponent {
  @Input() title = '';
  @Input() show = false;
  @Input() saving = false;
  @Input() saveBtnLabel = 'Sauvegarder';
  @Input() saveBtnClass = 'btn btn-primary';
  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  onOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closed.emit();
    }
  }
}
