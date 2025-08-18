import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Toolbar,
  AppBar,
  IconButton,
  Tooltip,
  Alert,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Wallet as WalletIcon,
  Group as GroupIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  ShoppingBasket as ShoppingBasketIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Inventory as InventoryIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';

// کامپوننت های نمودار را وارد می کنیم
import SalesChart from '../components/SalesChart';
import TopCommoditiesChart from '../components/TopCommoditiesChart';
import TopCostCentersChart from '../components/TopCostCentersChart';
import TopIncomeCentersChart from '../components/TopIncomeCentersChart';

import './DashboardPage.css'; // فایل استایل خودتان

// یک کامپوننت کارت اطلاعاتی برای نمایش خلاصه آمار
const InfoCard = ({ title, icon, color, data, to }) => (
  <Paper
    elevation={4}
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 220,
      backgroundColor: `${color}.lighten-4`, // این رنگ ها باید در تم شما تعریف شده باشند یا از رنگ های پیش فرض استفاده کنید
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      {icon}
      <Typography variant="h6" component="h3" sx={{ ml: 1 }}>{title}</Typography>
    </Box>
    <Box>
      {data.map((item, index) => (
        <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
           {item.icon}
           <span style={{ marginRight: '8px' }}>{item.label}: {item.value}</span>
        </Typography>
      ))}
    </Box>
  </Paper>
);


const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statements, setStatements] = useState([]);
  const [stat, setStat] = useState({});
  const [permissions, setPermissions] = useState({});

  // این داده ها باید از API شما بارگذاری شوند
  const [costData, setCostData] = useState({ today: 120, week: 850, month: 3200, year: 45000 });
  const [incomeData, setIncomeData] = useState({ today: 500, week: 2500, month: 9800, year: 115000 });
  const [wallet, setWallet] = useState({ deposit: 75000 });

  // وضعیت نمایش ویجت ها، مشابه فایل Vue
  const [dashboard, setDashboard] = useState({
    banks: true,
    wallet: true,
    buys: true,
    sells: true,
    commodities: true,
    acc_docs: true,
    persons: true,
    notif: true,
    sellChart: true,
    topCommodities: true,
    costs: true,
    topCostCenters: true,
    incomes: true,
    topIncomeCenters: true,
  });

  const handleDashboardChange = (event) => {
    setDashboard({
      ...dashboard,
      [event.target.name]: event.target.checked,
    });
  };

  // شبیه سازی بارگذاری داده ها از سرور
  useEffect(() => {
    setLoading(true);
    // در یک پروژه واقعی، اینجا با axios داده ها را از API می گیرید
    setTimeout(() => {
      setStatements([
        { dateSubmit: '۱۴۰۳/۰۵/۲۷', body: 'اطلاعیه مهم: گزارش های مالی ماهانه آماده است.' },
        { dateSubmit: '۱۴۰۳/۰۵/۲۶', body: 'یادآوری: جلسه هفتگی فردا ساعت ۱۰ صبح.' },
      ]);
      setStat({
        personCount: 150,
        recs_today: '۲۰,۰۰۰,۰۰۰',
        sends_today: '۱۵,۰۰۰,۰۰۰',
        sells_total: '۱,۲۰۰,۰۰۰,۰۰۰',
        sells_today: '۵۰,۰۰۰,۰۰۰',
        buys_total: '۸۰۰,۰۰۰,۰۰۰',
        buys_today: '۳۰,۰۰۰,۰۰۰',
        bankCount: 5,
        docCount: 2540,
        commodity: 85,
      });
      setPermissions({
          sell: true,
          cost: true,
          income: true,
          wallet: true,
          persons: true,
          buy: true,
          accounting: true,
          bank: true,
          commodity: true,
      });
      setLoading(false);
    }, 1500);
  }, []);

  const handleSaveSettings = () => {
    setLoading(true);
    // در اینجا تنظیمات را به سرور ارسال می کنید
    setTimeout(() => {
      setLoading(false);
      setDialogOpen(false);
      console.log('تنظیمات ذخیره شد:', dashboard);
    }, 1000);
  };
  
  if (loading && !dialogOpen) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
          </Box>
      );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            داشبورد
          </Typography>
          <Tooltip title="ویرایش داشبورد">
            <IconButton color="primary" onClick={() => setDialogOpen(true)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {statements.length > 0 && dashboard.notif && (
          <Alert severity="info" sx={{ mb: 2 }}>
              {statements.map((stmt, index) => (
                  <Typography key={index}>
                      <strong>{stmt.dateSubmit}:</strong> {stmt.body}
                  </Typography>
              ))}
          </Alert>
      )}

      <Grid container spacing={3}>
        {/* نمودار فروش */}
        {permissions.sell && dashboard.sellChart && (
            <Grid item xs={12}>
                <SalesChart />
            </Grid>
        )}
        {/* نمودار کالاهای پرفروش */}
        {permissions.sell && dashboard.topCommodities && (
            <Grid item xs={12}>
                <TopCommoditiesChart />
            </Grid>
        )}
        {/* نمودار مراکز هزینه */}
        {permissions.cost && dashboard.topCostCenters && (
            <Grid item xs={12} md={6}>
                <TopCostCentersChart />
            </Grid>
        )}
        {/* نمودار مراکز درآمد */}
        {permissions.income && dashboard.topIncomeCenters && (
            <Grid item xs={12} md={6}>
                <TopIncomeCentersChart />
            </Grid>
        )}

        {/* کارت های اطلاعاتی */}
        {permissions.wallet && dashboard.wallet && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="کیف پول" icon={<WalletIcon color="success"/>} color="success" data={[
                { label: 'موجودی', value: `${Number(wallet.deposit).toLocaleString()} ریال`, icon: <TrendingUpIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.persons && dashboard.persons && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="اشخاص" icon={<GroupIcon color="primary"/>} color="primary" data={[
                { label: 'تعداد', value: stat.personCount, icon: <GroupIcon fontSize="small"/> },
                { label: 'دریافت امروز', value: stat.recs_today, icon: <TrendingDownIcon fontSize="small"/> },
                { label: 'پرداخت امروز', value: stat.sends_today, icon: <TrendingUpIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.cost && dashboard.costs && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="هزینه‌ها" icon={<TrendingDownIcon color="error"/>} color="error" data={[
                { label: 'امروز', value: costData.today.toLocaleString(), icon: <TrendingDownIcon fontSize="small"/> },
                { label: 'هفته', value: costData.week.toLocaleString(), icon: <TrendingDownIcon fontSize="small"/> },
                { label: 'ماه', value: costData.month.toLocaleString(), icon: <TrendingDownIcon fontSize="small"/> },
                { label: 'سال', value: costData.year.toLocaleString(), icon: <TrendingDownIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.income && dashboard.incomes && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="درآمدها" icon={<TrendingUpIcon color="success"/>} color="success" data={[
                { label: 'امروز', value: incomeData.today.toLocaleString(), icon: <TrendingUpIcon fontSize="small"/> },
                { label: 'هفته', value: incomeData.week.toLocaleString(), icon: <TrendingUpIcon fontSize="small"/> },
                { label: 'ماه', value: incomeData.month.toLocaleString(), icon: <TrendingUpIcon fontSize="small"/> },
                { label: 'سال', value: incomeData.year.toLocaleString(), icon: <TrendingUpIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.sell && dashboard.sells && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="فروش" icon={<ShoppingCartIcon color="success"/>} color="success" data={[
                { label: 'مجموع', value: stat.sells_total, icon: <BarChartIcon fontSize="small"/> },
                { label: 'امروز', value: stat.sells_today, icon: <BarChartIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.buy && dashboard.buys && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="خرید" icon={<ShoppingBasketIcon color="error"/>} color="error" data={[
                { label: 'مجموع', value: stat.buys_total, icon: <BarChartIcon fontSize="small"/> },
                { label: 'امروز', value: stat.buys_today, icon: <BarChartIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.bank && dashboard.banks && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="بانک ها" icon={<AccountBalanceIcon color="info"/>} color="info" data={[
                { label: 'تعداد', value: stat.bankCount, icon: <AccountBalanceIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.accounting && dashboard.acc_docs && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="اسناد حسابداری" icon={<DescriptionIcon color="secondary"/>} color="secondary" data={[
                { label: 'تعداد', value: stat.docCount, icon: <DescriptionIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
        {permissions.commodity && dashboard.commodities && (
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard title="کالاها" icon={<InventoryIcon color="warning"/>} color="warning" data={[
                { label: 'تعداد', value: stat.commodity, icon: <InventoryIcon fontSize="small"/> },
            ]}/>
          </Grid>
        )}
      </Grid>
      
      {/* دیالوگ تنظیمات */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          ویرایش داشبورد
          <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            {loading && <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress /></Box>}
            {!loading && 
                <Grid container spacing={2}>
                    {Object.keys(dashboard).map((key) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                            <FormControlLabel
                                control={<Switch checked={dashboard[key]} onChange={handleDashboardChange} name={key} />}
                                label={key} // در پروژه واقعی از i18n برای ترجمه استفاده کنید
                            />
                        </Grid>
                    ))}
                </Grid>
            }
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveSettings} variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardPage;

// helper component
const FormControlLabel = ({ control, label }) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {control}
        <Typography>{label}</Typography>
    </Box>
)