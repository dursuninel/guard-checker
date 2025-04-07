import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Tooltip } from "primereact/tooltip";

export default function AdminPanel() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: "",
    gamename: "",
    email: "",
    password: "",
    host: "imap.gmail.com",
    port: "993",
    tls: true,
  });
  const [globalFilter, setGlobalFilter] = useState(null);
  const toast = useRef(null);
  const dt = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      } else {
        loadAccounts();
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadAccounts = async () => {
    try {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, "accounts"));
      const accountsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAccounts(accountsData);
    } catch (error) {
      console.error("Hesaplar yüklenirken hata:", error);
      showToast("error", "Hata", "Hesaplar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Çıkış hatası:", error);
      showToast("error", "Hata", "Çıkış yapılamadı");
    }
  };

  const handleAddAccount = async () => {
    if (
      !newAccount.username ||
      !newAccount.gamename ||
      !newAccount.email ||
      !newAccount.password ||
      !newAccount.host ||
      !newAccount.port
    ) {
      showToast("warn", "Uyarı", "Lütfen tüm alanları doldurun");
      return;
    }

    try {
      const db = getFirestore();
      await addDoc(collection(db, "accounts"), newAccount);
      showToast("success", "Başarılı", "Hesap eklendi");
      setVisible(false);
      setNewAccount({
        username: "",
        gamename: "",
        email: "",
        password: "",
        host: "",
        port: "",
        tls: true,
      });
      loadAccounts();
    } catch (error) {
      console.error("Hesap eklenirken hata:", error);
      showToast("error", "Hata", "Hesap eklenemedi");
    }
  };

  const confirmDelete = (id) => {
    confirmDialog({
      message: "Bu hesabı silmek istediğinizden emin misiniz?",
      header: "Silme Onayı",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Evet",
      rejectLabel: "Hayır",
      accept: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, "accounts", id));
      showToast("success", "Başarılı", "Hesap silindi");
      loadAccounts();
    } catch (error) {
      console.error("Hesap silinirken hata:", error);
      showToast("error", "Hata", "Hesap silinemedi");
    }
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Steam Hesapları</h5>
      <span className="p-input-icon-left">
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Ara..."
        />
      </span>
    </div>
  );

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-trash"
          severity="danger"
          rounded
          size="small"
          tooltip="Sil"
          tooltipOptions={{ position: "top" }}
          onClick={() => confirmDelete(rowData.id)}
        />
      </div>
    );
  };

  return (
    <div className="p-4" style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="m-0">Steam Hesapları</h2>
        <div>
          <Button
            label="Yeni Hesap"
            icon="pi pi-plus"
            severity="success"
            rounded
            onClick={() => setVisible(true)}
            className="mr-2"
          />
          <Button
            label="Çıkış"
            icon="pi pi-sign-out"
            severity="secondary"
            rounded
            onClick={handleLogout}
          />
        </div>
      </div>

      <Card>
        <DataTable
          ref={dt}
          value={accounts}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          globalFilter={globalFilter}
          header={header}
          emptyMessage="Hesap bulunamadı"
          stripedRows
          showGridlines
          size="small"
          tableStyle={{ minWidth: "50rem" }}
        >
          <Column
            field="username"
            header="Steam Kullanıcı Adı"
            sortable
            style={{ width: "15%" }}
          />
          <Column
            field="gamename"
            header="Oyun İsmi"
            sortable
            style={{ width: "15%" }}
          />
          <Column
            field="email"
            header="E-posta"
            sortable
            style={{ width: "20%" }}
          />
          <Column
            field="host"
            header="Sunucu"
            sortable
            style={{ width: "20%" }}
          />
          <Column
            field="port"
            header="Port"
            sortable
            style={{ width: "10%" }}
          />
          <Column
            field="tls"
            header="TLS"
            body={(rowData) => (
              <i
                className={`pi ${
                  rowData.tls
                    ? "pi-check-circle text-success"
                    : "pi-times-circle text-danger"
                }`}
              />
            )}
            sortable
            style={{ width: "10%" }}
          />
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: "10%", textAlign: "center" }}
          />
        </DataTable>
      </Card>

      <Dialog
        header="Yeni Hesap Ekle"
        visible={visible}
        style={{ width: '450px' }}
        modal
        draggable={false}
        resizable={false}
        onHide={() => setVisible(false)}
        footer={
          <div>
            <Button
              label="İptal"
              icon="pi pi-times"
              onClick={() => setVisible(false)}
              className="p-button-text"
            />
            <Button
              label="Ekle"
              icon="pi pi-check"
              severity="success"
              onClick={handleAddAccount}
              autoFocus
            />
          </div>
        }
      >
        <div className="p-fluid gap-2">
          <div className="field">
            <label htmlFor="username" className="font-bold block mb-1">
              Steam Kullanıcı Adı
            </label>
            <InputText
              id="username"
              value={newAccount.username}
              onChange={(e) =>
                setNewAccount({ ...newAccount, username: e.target.value })
              }
              className="p-inputtext-sm"
            />
          </div>
          <div className="field">
            <label htmlFor="gamename" className="font-bold block mb-1">
              Oyun İsmi
            </label>
            <InputText
              id="gamename"
              value={newAccount.gamename}
              onChange={(e) =>
                setNewAccount({ ...newAccount, gamename: e.target.value })
              }
              className="p-inputtext-sm"
            />
          </div>
          <div className="field">
            <label htmlFor="email" className="font-bold block mb-1">
              E-posta
            </label>
            <InputText
              id="email"
              autoComplete="off"
              value={newAccount.email}
              onChange={(e) =>
                setNewAccount({ ...newAccount, email: e.target.value })
              }
              className="p-inputtext-sm"
            />
          </div>
          <div className="field">
            <label htmlFor="password" className="font-bold block mb-1">
              E-Posta (Uygulama) Şifresi
            </label>
            <InputText
              id="password"
              type="password"
              value={newAccount.password}
              onChange={(e) =>
                setNewAccount({ ...newAccount, password: e.target.value })
              }
              className="p-inputtext-sm"
            />
          </div>
          <div className="field">
            <label htmlFor="host" className="font-bold block mb-1">
              E-posta Sunucusu
            </label>
            <InputText
              id="host"
              value={newAccount.host}
              onChange={(e) =>
                setNewAccount({ ...newAccount, host: e.target.value })
              }
              className="p-inputtext-sm"
            />
          </div>
          <div className="field">
            <label htmlFor="port" className="font-bold block mb-1">
              Port
            </label>
            <InputText
              id="port"
              value={newAccount.port}
              onChange={(e) =>
                setNewAccount({ ...newAccount, port: e.target.value })
              }
              className="p-inputtext-sm"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
