import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { VenteOeufsService } from '../../core/services/vente-oeufs.service';
import { OeufsService } from '../../core/services/oeufs.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { VenteOeufs, EnregistrementOeufs } from '../../core/models/models';

@Component({
  selector: 'app-vente-oeufs',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './vente-oeufs.html',
  styleUrl: './vente-oeufs.scss',
})
export class VenteOeufsComponent implements OnInit {
  private svc     = inject(VenteOeufsService);
  private oeufSvc = inject(OeufsService);

  items: VenteOeufs[] = []; oeufs: EnregistrementOeufs[] = [];
  loading = false; error = '';
  showModal = false; saving = false;
  editId: number | null = null; form: Partial<VenteOeufs> = {};
  deleteId: number | null = null; showConfirm = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({ items: this.svc.getAll(), oeufs: this.oeufSvc.getAll() }).subscribe({
      next: ({ items, oeufs }) => { this.items = items; this.oeufs = oeufs; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les ventes.'; this.loading = false; },
    });
  }

  oeufLabel(id: number) {
    const o = this.oeufs.find(x => x.oeuf_id === id);
    return o ? `#${o.oeuf_id} (${o.date_collecte})` : id;
  }

  openCreate() { this.editId = null; this.form = {}; this.showModal = true; }
  openEdit(v: VenteOeufs) { this.editId = v.vente_id!; this.form = { ...v }; this.showModal = true; }

  save() {
    this.saving = true;
    const obs = this.editId ? this.svc.update(this.editId, this.form as VenteOeufs) : this.svc.create(this.form as VenteOeufs);
    obs.subscribe({ next: () => { this.showModal = false; this.saving = false; this.load(); }, error: () => { this.saving = false; } });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }
  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe(() => { this.showConfirm = false; this.deleteId = null; this.load(); });
  }
}
