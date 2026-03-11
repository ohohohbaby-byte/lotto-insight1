export function getLottoBallColor(num: number): string {
  if (num <= 10) {
    return "bg-yellow-400 text-black";
  }

  if (num <= 20) {
    return "bg-blue-500 text-white";
  }

  if (num <= 30) {
    return "bg-red-500 text-white";
  }

  if (num <= 40) {
    return "bg-gray-500 text-white";
  }

  return "bg-green-500 text-white";
}