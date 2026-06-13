import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../redux/slices/uiSlice";
import CreateGroupModal from "./CreateGroupModal";
import ChatInfoModal from "./ChatInfoModal";
import SearchModal from "./SearchModal";
import NotificationsModal from "./NotificationsModal";

export default function ModalManager() {
  const dispatch = useDispatch();
  const { activeModal, modalData } = useSelector((s) => s.ui);

  if (!activeModal) return null;

  const handleClose = () => dispatch(closeModal());

  const modals = {
    createGroup:   <CreateGroupModal onClose={handleClose} />,
    chatInfo:      <ChatInfoModal chat={modalData} onClose={handleClose} />,
    search:        <SearchModal onClose={handleClose} />,
    notifications: <NotificationsModal onClose={handleClose} />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      {/* Sheet slides up on mobile, centered on sm+ */}
      <div className="relative z-10 animate-slide-up w-full sm:max-w-lg">
        {modals[activeModal]}
      </div>
    </div>
  );
}
