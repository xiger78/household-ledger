import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DataProvider, useData } from './src/context/DataContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { MonthSelector } from './src/components/MonthSelector';
import { Dashboard } from './src/components/Dashboard';
import { TransactionList } from './src/components/TransactionList';
import { CalendarView } from './src/components/CalendarView';
import { SettingsView } from './src/components/SettingsView';
import { TransactionForm } from './src/components/TransactionForm';
import { ReceiptScanner, ReceiptScanResult } from './src/components/ReceiptScanner';
import { getSettings, getTransactionsByMonth } from './src/store/database';
import { Transaction } from './src/types';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

type TabKey = 'dashboard' | 'transactions' | 'calendar' | 'settings';

const TAB_CONFIG: { key: TabKey; labelKey: 'tabDashboard' | 'tabTransactions' | 'tabCalendar' | 'tabSettings'; icon: string }[] = [
  { key: 'dashboard', labelKey: 'tabDashboard', icon: '📊' },
  { key: 'transactions', labelKey: 'tabTransactions', icon: '📋' },
  { key: 'calendar', labelKey: 'tabCalendar', icon: '📅' },
  { key: 'settings', labelKey: 'tabSettings', icon: '⚙️' },
];

function MainScreen({ route }: { route: { name: TabKey } }) {
  const { refreshKey, refresh } = useData();
  const settings = getSettings();
  const now = new Date();
  const [year, setYear] = useState(settings.year || now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [prefill, setPrefill] = useState<ReceiptScanResult | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | undefined>();

  const tabName = route.name;
  const transactions = getTransactionsByMonth(year, month);

  function prevMonth() {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setPrefill(null);
    setShowForm(true);
  }

  return (
    <View style={styles.screen} key={refreshKey}>
      {tabName !== 'settings' && (
        <MonthSelector year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      )}

      {tabName === 'dashboard' && <Dashboard year={year} month={month} />}
      {tabName === 'transactions' && (
        <TransactionList
          transactions={transactions}
          onEdit={openEdit}
          onChanged={refresh}
        />
      )}
      {tabName === 'calendar' && (
        <CalendarView
          year={year}
          month={month}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onEditTransaction={openEdit}
        />
      )}
      {tabName === 'settings' && <SettingsView onChanged={refresh} />}

      {(tabName === 'transactions' || tabName === 'calendar') && (
        <>
          <TouchableOpacity
            style={styles.fabCamera}
            onPress={() => setShowScanner(true)}
          >
            <Text style={styles.fabCameraText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setEditing(null);
              setPrefill(null);
              setShowForm(true);
            }}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      <ReceiptScanner
        visible={showScanner}
        defaultYear={year}
        defaultMonth={month}
        defaultDay={tabName === 'calendar' ? selectedDay : undefined}
        onClose={() => setShowScanner(false)}
        onSaved={refresh}
        onEdit={(data) => {
          setEditing(null);
          setPrefill(data);
          setShowForm(true);
        }}
      />

      <TransactionForm
        visible={showForm}
        year={year}
        month={month}
        day={tabName === 'calendar' ? selectedDay : undefined}
        editing={editing}
        prefill={prefill}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
          setPrefill(null);
        }}
        onSaved={refresh}
      />
    </View>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function AppNavigator() {
  const { t, language } = useLanguage();

  return (
    <Tab.Navigator
      key={language}
      screenOptions={({ route }) => {
        const config = TAB_CONFIG.find((c) => c.key === route.name)!;
        return {
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon={config.icon} focused={focused} />,
          tabBarLabel: t(config.labelKey),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 11 },
        };
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tab.Screen key={tab.key} name={tab.key}>
          {(props) => <MainScreen route={props.route} />}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

function AppHeader() {
  const { t, language } = useLanguage();
  const year = getSettings().year;

  return (
    <View style={styles.header} key={language}>
      <Text style={styles.headerTitle}>{t('appTitle')}</Text>
      <Text style={styles.headerSub}>{year}{t('appSubtitle')}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <LanguageProvider>
          <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
            <StatusBar style="light" />
          </SafeAreaView>
        </LanguageProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fabCamera: {
    position: 'absolute',
    bottom: 16,
    right: 86,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.expense,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.expense,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabCameraText: {
    fontSize: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
});
