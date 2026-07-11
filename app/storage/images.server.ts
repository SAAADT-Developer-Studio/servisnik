const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
]);

function extensionForType(type: string) {
	switch (type) {
		case "image/jpeg":
			return "jpg";
		case "image/png":
			return "png";
		case "image/webp":
			return "webp";
		case "image/heic":
			return "heic";
		default:
			return "bin";
	}
}

export function parsePhotoFiles(formData: FormData) {
	return formData
		.getAll("photos")
		.filter((entry): entry is File => entry instanceof File && entry.size > 0)
		.filter(
			(file) => ALLOWED_TYPES.has(file.type) && file.size <= MAX_FILE_SIZE,
		)
		.slice(0, MAX_PHOTOS);
}

export async function uploadTicketImages(
	bucket: R2Bucket,
	ticketId: string,
	photos: File[],
) {
	const keys: string[] = [];

	for (const photo of photos) {
		const key = `tickets/${ticketId}/${crypto.randomUUID()}.${extensionForType(photo.type)}`;

		await bucket.put(key, photo.stream(), {
			httpMetadata: { contentType: photo.type },
		});

		keys.push(key);
	}

	return keys;
}
