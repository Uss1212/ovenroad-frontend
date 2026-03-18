import Header from '../components/Header/Header';
import HeroImage from '../components/HeroImage/HeroImage';
import CourseInfo from '../components/CourseInfo/CourseInfo';
import CourseMap from '../components/CourseMap/CourseMap';
import PlaceList from '../components/PlaceList/PlaceList';
import Description from '../components/Description/Description';
import Comments from '../components/Comments/Comments';
import BottomBar from '../components/BottomBar/BottomBar';
import Footer from '../components/Footer/Footer';

export default function CourseDetailPage() {
  return (
    <div>
      <Header />
      <HeroImage />
      <CourseInfo />
      <CourseMap />
      <PlaceList />
      <Description />
      <Comments />
      <BottomBar />
      <Footer />
    </div>
  );
}
