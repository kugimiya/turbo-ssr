import React from 'react';

const IndexPage = ({ time }: { time: string }) => {
  return (
    <div>
      <p>Hello, world! This is home page. Time is: {time}</p>
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
