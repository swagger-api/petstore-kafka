import {ButtonHTMLAttributes, HTMLProps } from 'react'

export type COLORS = {
  red: string;
  blue: string;
  orange: string;
  yellow: string;
  lime: string;
  green: string;
}

export type SIZES = {
  xs: string;
  md: string;
  lg: string;
}

const PILL_COLORS: COLORS = {
  'red': 'bg-red-100 text-red-800',
  'blue': 'bg-blue-100 text-blue-800',
  'orange': 'bg-orange-100 text-orange-800',
  'yellow': 'bg-yellow-100 text-yellow-800',
  'lime': 'bg-lime-100 text-lime-800',
  'green': 'bg-green-100 text-green-800',
}

export function Pill(
  { color, className='', ...props }:
  { color?: keyof COLORS; } & HTMLProps<HTMLSpanElement>) {
  let colorClasses = color ? PILL_COLORS[color] : PILL_COLORS['blue']

  return (
    <span className={`${colorClasses} px-2 uppercase inline-flex text-xs leading-5 rounded-full ${className}`} {...props} />
  )
}

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: keyof COLORS;
  size?: keyof SIZES;
}

const BUTTON_SIZES: SIZES = {
  xs: 'text-xs',
  md: 'text-md',
  lg: 'text-lg',
}

const BUTTON_COLORS: COLORS = {
  blue: 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800',
  red: 'bg-red-500 hover:bg-red-600 focus:bg-red-600 active:bg-red-700',
  orange: 'bg-orange-500 hover:bg-orange-600 focus:bg-orange-600 active:bg-orange-700',
  yellow: 'bg-yellow-500 hover:bg-yellow-600 focus:bg-yellow-600 active:bg-yellow-700',
  lime: 'bg-lime-500 hover:bg-lime-600 focus:bg-lime-600 active:bg-lime-700 hover:text-black text-gray-800',
  green: 'bg-green-500 hover:bg-green-600 focus:bg-green-600 active:bg-green-700',
}

export const Button = ({ className='', color='blue', size='xs', ...props}: IButton ) => {
  const colorClasses = BUTTON_COLORS[color]
  const sizeClasses = BUTTON_SIZES[size]
  return (
    <div className="inline-flex space-x-2 justify-center">
      <button className={`${className} ${colorClasses} ${sizeClasses} disabled:bg-gray-300 disabled:text-gray-500 inline-block px-3 py-1.5  text-white font-medium leading-tight uppercase rounded focus:outline-none focus:ring-0  active:shadow-lg transition duration-150 ease-in-out`} {...props} />
    </div>
  )
}
