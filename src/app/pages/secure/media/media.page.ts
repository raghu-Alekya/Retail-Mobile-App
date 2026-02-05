import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service'; 

@Component({
  selector: 'app-media',
  templateUrl: './media.page.html',
  styleUrls: ['./media.page.scss']
})
export class MediaPage implements OnInit {

  mediaList: any[] = [];
  uploading = false;
  page = 1;
  perPage = 20;
  hasMore = true;
  loading = false;
  constructor(private mediaService: AuthService) {}

  ngOnInit() {
    this.loadMedia();
  }

  async loadMedia(event?: any) {
      if (this.loading || !this.hasMore) return;

      this.loading = true;

      try {
        const res = await this.mediaService.getMedia(this.page, this.perPage);

        if (res.data.length < this.perPage) {
          this.hasMore = false;
        }

        this.mediaList = [...this.mediaList, ...res.data];
        this.page++;

      } catch (e) {
        this.hasMore = false;
      }

      this.loading = false;
      if (event) event.target.complete();
    }

    async refresh(event: any) {
      this.page = 1;
      this.mediaList = [];
      this.hasMore = true;
      await this.loadMedia();
      event.target.complete();
    }

  async onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploading = true;
    await this.mediaService.uploadMedia(file);
    this.uploading = false;
    this.loadMedia();
  }

  async updateMedia(item: any) {
    await this.mediaService.updateMedia(item.id, {
      title: item.title.rendered,
      alt_text: item.alt_text
    });
    alert('Updated');
  }

  async deleteMedia(id: number) {
    if (!confirm('Delete this media?')) return;
    await this.mediaService.deleteMedia(id);
    this.loadMedia();
  }
}
