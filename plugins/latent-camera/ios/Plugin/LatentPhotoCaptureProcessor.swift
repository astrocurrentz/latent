import AVFoundation

final class LatentPhotoCaptureProcessor: NSObject, AVCapturePhotoCaptureDelegate {
    let id: UUID
    private let completion: (Result<AVCapturePhoto, Error>) -> Void

    init(id: UUID = UUID(), completion: @escaping (Result<AVCapturePhoto, Error>) -> Void) {
        self.id = id
        self.completion = completion
        super.init()
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error {
            completion(.failure(error))
            return
        }

        completion(.success(photo))
    }
}
