import './loading-spinner.scss'

const LoadingSpinner = () => {
  return (
    <div className="loadingSpinner" role="status" aria-label="Ladowanie danych">
      <div className="loadingSpinnerDot" />
    </div>
  )
}

export default LoadingSpinner
