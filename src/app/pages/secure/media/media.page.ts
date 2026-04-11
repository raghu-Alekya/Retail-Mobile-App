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
  selectedMedia: any = null;

  constructor(private mediaService: AuthService) {}

  ngOnInit() {
    this.loadMedia();
  }

  async loadMedia(event?: any) {
    if (this.loading || !this.hasMore) return;

    this.loading = true;

    try {
      const res = await this.mediaService.getMedia(
        String(this.page),
        String(this.perPage)
      );

      if (!Array.isArray(res)) {
        console.error("Invalid media response:", res);
        this.hasMore = false;
        return;
      }

      if (res.length < this.perPage) {
        this.hasMore = false;
      }

      this.mediaList = [...this.mediaList, ...res];
      this.page++;

    } catch (e) {
      console.error("MEDIA ERROR:", e);
      this.hasMore = false;
    }

    this.loading = false;
    if (event) event.target.complete();
  }

  async onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await this.mediaService.uploadMedia(file);

      // Reload after upload
      this.page = 1;
      this.mediaList = [];
      this.hasMore = true;
      await this.loadMedia();

    } catch (error) {
      console.error('Upload failed', error);
    }
  }

  selectMedia(media: any) {
    this.selectedMedia = media;
  }

  async handleDelete(id: number) {
    if (!confirm('Delete this media?')) return;

    try {
      await this.mediaService.deleteMedia(id);
      this.mediaList = this.mediaList.filter(m => m.id !== id);
      this.selectedMedia = null;
    } catch (error) {
      console.error('Delete failed', error);
    }
  }

  refresh(event: any) {
    this.page = 1;
    this.mediaList = [];
    this.hasMore = true;

    this.loadMedia(event);
  }

  openCamera() {
    console.log('Open camera clicked');
  }
}