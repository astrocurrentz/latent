import AVFoundation

final class LatentPhotoCaptureProcessor: NSObject, AVCapturePhotoCaptureDelegate {
    private let completion: (Result<AVCapturePhoto, Error>) -> Void

    init(completion: @escaping (Result<AVCapturePhoto, Error>) -> Void) {
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
