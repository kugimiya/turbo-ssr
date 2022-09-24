import React, { useEffect, useState } from 'react';

const IndexPage = ({ time }: { time: string }) => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setInterval(() => setCounter(_ => _ + 1), 250);
  }, []);

  return (
    <div>
      <p>Hello, world! This is home page. Time is: {time}</p>
      <p>{counter}</p>
      <a href="/test">goto test</a>
    </div>
  );
}

export const props = async () => {
  return {
    time: (new Date()).toISOString(),
  }
}

export default IndexPage;
