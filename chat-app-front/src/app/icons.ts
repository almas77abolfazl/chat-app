import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArchive,
  faBriefcase,
  faCamera,
  faCheckCircle,
  faComments,
  faEllipsisH,
  faKey,
  faNewspaper,
  faPaperPlane,
  faRobot,
  faSearch,
  faSignOutAlt,
  faUserCircle,
  faUserFriends,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';

export function registerAppIcons(library: FaIconLibrary): void {
  library.addIcons(
    faArchive,
    faBriefcase,
    faCamera,
    faCheckCircle,
    faComments,
    faEllipsisH,
    faKey,
    faNewspaper,
    faPaperPlane,
    faRobot,
    faSearch,
    faSignOutAlt,
    faUserCircle,
    faUserFriends,
    faUserPlus,
  );
}
