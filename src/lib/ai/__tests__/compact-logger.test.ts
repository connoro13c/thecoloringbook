/**
 * Test the compact logging system
 */
import { CompactLogger, createVisionMetrics, createImageMetrics } from '../compact-logger'

describe('CompactLogger', () => {
  let originalLog: typeof console.log
  let originalError: typeof console.error
  let originalTime: typeof console.time
  let originalTimeEnd: typeof console.timeEnd
  
  const mockLog = jest.fn()
  const mockError = jest.fn()
  const mockTime = jest.fn()
  const mockTimeEnd = jest.fn()

  beforeEach(() => {
    originalLog = console.log
    originalError = console.error
    originalTime = console.time
    originalTimeEnd = console.timeEnd
    
    console.log = mockLog
    console.error = mockError
    console.time = mockTime
    console.timeEnd = mockTimeEnd
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    console.log = originalLog
    console.error = originalError
    console.time = originalTime
    console.timeEnd = originalTimeEnd
  })

  test('should initialize pipeline with correct parameters', () => {
    const logger = new CompactLogger()
    
    logger.startPipeline({
      style: 'Ghibli',
      difficulty: 3,
      photoSize: 2_860_000 // 2.86 MB in bytes
    })

    expect(mockTime).toHaveBeenCalledWith('pipeline')
    expect(mockLog).toHaveBeenCalledWith('🎨  Coloring‑page job started  (style=Ghibli, difficulty=3)')
    expect(mockLog).toHaveBeenCalledWith('📸  Photo uploaded……………… 2.86 MB')
  })

  test('should log vision metrics correctly', () => {
    const logger = new CompactLogger()
    const metrics = createVisionMetrics(1059, 154)
    
    logger.logVision(metrics)

    expect(mockLog).toHaveBeenCalledWith('🧠  Vision step ▸ gpt‑4o')
    expect(mockLog).toHaveBeenCalledWith('    Tokens  in/out  1,059 / 154')
    expect(mockLog).toHaveBeenCalledWith('    Cost   $0.0084')
  })

  test('should log image metrics correctly', () => {
    const logger = new CompactLogger()
    const metrics = createImageMetrics(400, 'medium')
    
    logger.logImage(metrics)

    expect(mockLog).toHaveBeenCalledWith('🖌️  Image step ▸ gpt‑image‑1  (medium quality)')
    expect(mockLog).toHaveBeenCalledWith('    Tokens  in/out       400 / 0')
    expect(mockLog).toHaveBeenCalledWith('    Image   flat fee     $0.0400')
    expect(mockLog).toHaveBeenCalledWith('    Cost   $0.0420')
  })

  test('should complete pipeline with total cost', () => {
    const logger = new CompactLogger()
    
    // Add some costs
    const visionMetrics = createVisionMetrics(1059, 154)
    const imageMetrics = createImageMetrics(400, 'medium')
    
    logger.logVision(visionMetrics)
    logger.logImage(imageMetrics)
    logger.completePipeline()

    expect(mockTimeEnd).toHaveBeenCalledWith('pipeline')
    expect(mockLog).toHaveBeenCalledWith(expect.stringMatching(/✅  Done in \d+\.\d s/))
    expect(mockLog).toHaveBeenCalledWith('💸  **OpenAI API total: $0.0504**')
  })

  test('should respect debug mode', () => {
    process.env.LOG_LEVEL = 'debug'
    const logger = new CompactLogger()
    const metrics = createVisionMetrics(1059, 154)
    
    logger.logVision(metrics)

    // Should still log regular output plus debug info
    expect(mockLog).toHaveBeenCalledWith('🧠  Vision step ▸ gpt‑4o')
    
    delete process.env.LOG_LEVEL
  })

  test('should calculate costs correctly', () => {
    const visionMetrics = createVisionMetrics(1059, 154)
    const imageMetrics = createImageMetrics(400, 'medium')

    expect(visionMetrics.cost.formattedCost).toBe('$0.0084')
    expect(imageMetrics.cost.formattedCost).toBe('$0.0420')
  })
})
