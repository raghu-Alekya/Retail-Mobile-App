import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { LoadingController } from '@ionic/angular';

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

  constructor(private mediaService: AuthService, private loadingCtrl: LoadingController) {}

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

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file || this.uploading) {
      if (input) input.value = '';
      return;
    }

    this.uploading = true;
    try {
      await this.uploadFile(file);
    } finally {
      this.uploading = false;
      // Reset value so selecting the same image again still emits change.
      if (input) input.value = '';
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

  async openCamera(type: 'camera' | 'gallery' = 'camera') {
    

  const loading = await this.loadingCtrl.create({
    message: 'Uploading image...',
    spinner: 'crescent',
    backdropDismiss: false
  });

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: type === 'camera'
        ? CameraSource.Camera
        : CameraSource.Photos
    });

    if (Capacitor.isNativePlatform() && image.path) {

      await loading.present();

      const ext = image.format || 'jpg';

      await this.mediaService.uploadMediaFromPath(
        image.path,
        `upload.${ext}`
      );

      this.page = 1;
      this.mediaList = [];
      this.hasMore = true;

      await this.loadMedia();

      await loading.dismiss();
      return;
    }

    if (!image.webPath) {
      return;
    }

    const response = await fetch(image.webPath);
    const blob = await response.blob();

    const file = new File(
      [blob],
      'upload.jpg',
      { type: blob.type || 'image/jpeg' }
    );

    await this.uploadFile(file);

  } catch (err) {
    console.error(err);
  } finally {
    await loading.dismiss();
  }
}

  async uploadFile(file: File) {

  const loading = await this.loadingCtrl.create({
    message: 'Uploading image...',
    spinner: 'crescent'
  });

  await loading.present();

  try {
    await this.mediaService.uploadMedia(file);

    this.page = 1;
    this.mediaList = [];
    this.hasMore = true;

    await this.loadMedia();

  } finally {
    await loading.dismiss();
  }
}

  async openGallery() {
    await this.openCamera('gallery');
  }

  pickImage(fileInput: HTMLInputElement, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.uploading) return;

    const platform = Capacitor.getPlatform();

    // Use native gallery on iOS to avoid WKWebView file-upload issues.
    if (platform === 'ios') {
      this.openGallery();
      return;
    }

    if (Capacitor.isNativePlatform()) {
      this.openGallery();
      return;
    }

    fileInput.click();
  }
}