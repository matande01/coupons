import { useId } from 'react'
import { copMarkup } from './copSvg'

// <Cop pose="idle|magnify|scan|thumbs" /> — decorative by default; pass `title` to expose it to screen readers.
export default function Cop({ pose = 'idle', animated = true, className = '', title }) {
  const uid = 'cop' + useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg
      viewBox="0 0 200 210"
      className={`${animated ? 'cop-anim' : ''} ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: copMarkup(pose, uid) }}
    />
  )
}
