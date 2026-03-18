import Header from '../components/Header/Header';
import Celebration from '../components/Celebration/Celebration';
import CourseSummaryCard from '../components/CourseSummaryCard/CourseSummaryCard';
import StatsPreview from '../components/StatsPreview/StatsPreview';
import MapPreview from '../components/MapPreview/MapPreview';
import PlaceList from '../components/PlaceList/PlaceList';
import ShareSection from '../components/ShareSection/ShareSection';
import NextActions from '../components/NextActions/NextActions';
import Footer from '../components/Footer/Footer';

export default function CourseCompletePage() {
  return (
    <div>
      <Header />
      <Celebration />
      <CourseSummaryCard />
      <StatsPreview />
      <MapPreview />
      <PlaceList />
      <ShareSection />
      <NextActions />
      <Footer />
    </div>
  );
}
