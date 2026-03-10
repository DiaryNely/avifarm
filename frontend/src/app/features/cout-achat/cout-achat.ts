import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CoutAchatService } from '../../core/services/cout-achat.service';
import { LotService } from '../../core/services/lot.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { CoutAchat, Lot } from '../../core/models/models';

@Component({
  selector: 'app-cout-achat',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './cout-achat.html',
  styleUrl: './cout-achat.scss',
})
export class CoutAchatComponent implements OnInit {
  private svc    = inject(CoutAchatService);
  private lotSvc = inject(LotService);

  items: CoutAchat[] = []; lots: Lot[] = [];
  loading = false; error = '';
  showModal = false; saving = false;
  editId: number | null = null; form: Partial<CoutAchat> = {};
  deleteId: number | null = null; showConfirm = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({ items: this.svc.getAll(), lots: this.lotSvc.getAll() }).subscribe({
      next: ({ items, lots }) => { this.items = items; this.lots = lots; this.loading = false; },
      error: () => { this.error = "Impossible de charger les coûts d'achat."; this.loading = false; },
    });
  }

  lotNum(id: number) { return this.lots.find(l => l.lot_id === id)?.numero ?? id; }

  saveError = '';

  openCreate() { this.editId = null; this.form = {}; this.saveError = ''; this.showModal = true; }
  openEdit(c: CoutAchat) { this.editId = c.achat_id!; this.form = { ...c }; this.saveError = ''; this.showModal = true; }

  save() {
    this.saveError = '';
    if (!this.form.lot_id) { this.saveError = 'Veuillez sélectionner un lot.'; return; }
    if (!this.form.date_achat) { this.saveError = 'La date d\'achat est obligatoire.'; return; }
    if (!(this.form.cout_total! > 0)) { this.saveError = 'Le coût total doit être > 0.'; return; }
    this.saving = true;
    const obs = this.editId ? this.svc.update(this.editId, this.form as CoutAchat) : this.svc.create(this.form as CoutAchat);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.load(); },
      error: (err) => { this.saving = false; this.saveError = err?.error?.error ?? 'Erreur lors de l\'enregistrement.'; },
    });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }
  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe(() => { this.showConfirm = false; this.deleteId = null; this.load(); });
  }
}
