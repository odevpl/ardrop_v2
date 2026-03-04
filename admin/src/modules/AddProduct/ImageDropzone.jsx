import { useEffect, useMemo, useRef, useState } from 'react'

const ImageDropzone = ({
  images,
  setImages,
  existingImages = [],
  onDeleteExistingImage,
  onSetMainExistingImage,
  isExistingActionLoading = false,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const appendFiles = (files) => {
    if (!files?.length) return
    setImages((prev) => [...prev, ...files])
  }

  const handleImagesChange = (event) => {
    appendFiles(Array.from(event.target.files || []))
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    appendFiles(Array.from(event.dataTransfer?.files || []))
  }

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const imagePreviews = useMemo(
    () =>
      images.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [images],
  )

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [imagePreviews])

  return (
    <div className="adminImageUpload">
      <label htmlFor="product-images">Zdjecia produktu</label>
      <div
        className={`adminDropzone ${isDragOver ? 'adminDropzoneActive' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <p>Przeciagnij i upusc zdjecia tutaj</p>
        <input
          ref={fileInputRef}
          id="product-images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagesChange}
          disabled={disabled}
          className="adminHiddenFileInput"
        />
      </div>

      {existingImages.length > 0 ? (
        <>
          <p className="adminImageHint">Aktualne zdjecia</p>
          <div className="adminImageGrid">
            {existingImages.map((image) => (
              <div key={`existing-${image.id}`} className="adminImageTile">
                <img src={image.url} alt={image.alt || image.fileName || 'Zdjecie produktu'} />
                {image.isMain ? (
                  <span className="adminImageMainBadge">Glowne</span>
                ) : (
                  <button
                    type="button"
                    className="adminImageMainButton"
                    onClick={() => onSetMainExistingImage?.(image)}
                    disabled={disabled || isExistingActionLoading}
                  >
                    Ustaw glowne
                  </button>
                )}
                <button
                  type="button"
                  className="adminImageDelete"
                  onClick={() => onDeleteExistingImage?.(image)}
                  disabled={disabled || isExistingActionLoading}
                  aria-label={`Usun ${image.fileName}`}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {imagePreviews.length > 0 ? (
        <>
          <p className="adminImageHint">Nowe zdjecia do dodania</p>
          <div className="adminImageGrid">
            {imagePreviews.map((preview, index) => (
              <div key={preview.id} className="adminImageTile">
                <img src={preview.url} alt={preview.file.name} />
                <button
                  type="button"
                  className="adminImageDelete"
                  onClick={() => removeImage(index)}
                  aria-label={`Usun ${preview.file.name}`}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        existingImages.length === 0 ? <p className="adminImageHint">Brak wybranych zdjec</p> : null
      )}
    </div>
  )
}

export default ImageDropzone
