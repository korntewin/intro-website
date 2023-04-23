import Link from 'next/link';

import Navbar from '../components/navbar/v2/navbar.component';
import MovingDots from '@/components/movingdots/movingdots.component';
import CardList from '@/components/cardlist/cardlist.component';

const assetPrefix = "/intro-website";

const companies = [
  { imgSrc: `${assetPrefix}/tm.png`, name: "Thinking Machines", href: "/experience/tm", description: "Machine Learning Engineer", width: 200, height: 200 },
  { imgSrc: `${assetPrefix}/kbtg.png`, name: "KBTG", href: "/experience/kbtg", description: "Machine Learning Engineer", width: 90, height: 90 },
  { imgSrc: `${assetPrefix}/blockfint.jpg`, name: "Blockfint", href: "/experience/blockfint", description: "Business Analyst", width: 140, height: 90 },
  { imgSrc: `${assetPrefix}/gpsc.png`, name: "GPSC", href: "/experience/gpsc", description: "Power System Engineer", width: 180, height: 180 },
  { imgSrc: `${assetPrefix}/cu.png`, name: "CU", href: "/experience/cu", description: "Researcher", width: 90, height: 90 },
]

export default function Home() {
  return (
    <div>
      <Navbar addClass='' />
      <MovingDots
        movingDotsId='home-movingdots'
        dispMain="Welcome to my Homepage!"
        dispSub={[
          "I'm Korn, and this is my self-introduction website.",
          "You can find everything related to my working experience here, enjoy!"
        ]}
      />

      {/* working experience section */}
      <div
        className="flex items-center flex-col bg-gradient-to-r from-green-400 to-blue-500 brightness-95"
      >
        <h1
          className="text-center mt-5 text-5xl text-white subpixel-antialiased drop-shadow-lg font-semibold"
        >
          Working experience
        </h1>
        <p className="text-center mt-5 text-xl text-white subpixel-antialiased drop-shadow-lg font-semibold">
          My current main area of focuses are on Data Science career path, especially Machine Learning Engineer.
        </p>
        <p className="text-center mt-1 text-xl text-white subpixel-antialiased drop-shadow-lg font-semibold">
          However, my past experience cover many roles including Researcher (in Power System field),
          Power System Engineer, Business Development, Business Analyst, and Machine Learning Engineer.
          And covering many industries such as Energy, Finance, and Consulting.
        </p>
        <p className="text-center mt-5 text-2xl text-white subpixel-antialiased drop-shadow-lg font-semibold">
          Belows are my working experience so far.
        </p>
        <CardList ls={companies} />
      </div>

      {/* about me section */}
      <div
        className="flex items-center flex-col bg-gradient-to-r from-green-400 to-blue-500 brightness-100"
      >
        <h1
          className="text-center mt-5 text-5xl text-white subpixel-antialiased drop-shadow-lg font-semibold"
        >
          About me
        </h1>
        <p
          className="text-center mx-20 mt-10 text-xl text-white subpixel-antialiased drop-shadow-lg font-semibold"
        >
          Hello👋,
          I&apos;m a self-starter with a willingness to learn, exhibited by proven self-taught skills in Engineergin with GCP&apos;s Professional Data Enginner and GCP&apos;s Professional Data Architect certificate, Deep Learning with Tensorflow Developer Certificate and contribution to Tensorflow Organization codebase.
        </p>
        <p
          className="text-center mt-5 mb-10 text-xl text-white subpixel-antialiased drop-shadow-lg font-semibold"
        >
          <Link href="/about"> You can read more about me here </Link>.
        </p>
      </div>

    </div>
  )
}

export { companies, assetPrefix };
